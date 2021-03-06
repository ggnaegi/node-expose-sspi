import { hexDump } from './misc';
import {
  sspi,
  UserCredential,
  SecurityContext,
  InitializeSecurityContextInput,
  AcceptSecurityContextInput,
  ServerSecurityContext,
} from '../../lib/api';
import { SSO } from './SSO';
import dbg from 'debug';

const debug = dbg('node-expose-sspi:connect');

/**
 * Retrieves SSO information from an explicit credential (login/password and domain).
 * The SSO information will be retrieved only if the credential
 * matches a local account or a domain account.
 *
 * @param {sspi.UserCredential} userCredential
 * @returns {SSO} the SSO object.
 */
export async function connect(userCredential: UserCredential): Promise<SSO> {
  const errorMsg = 'Error while building the security context';
  const badLoginPasswordError = new Error('Sorry. Logon denied.');
  try {
    const packageInfo = sspi.QuerySecurityPackageInfo('Negotiate');
    const clientCred = sspi.AcquireCredentialsHandle({
      packageName: 'Negotiate',
      authData: userCredential,
    });
    const serverCred = sspi.AcquireCredentialsHandle({
      packageName: 'Negotiate',
    });

    let serverSecurityContext!: ServerSecurityContext;
    let clientSecurityContext!: SecurityContext;
    const clientInput: InitializeSecurityContextInput = {
      credential: clientCred.credential,
      targetName: 'kiki',
      cbMaxToken: packageInfo.cbMaxToken,
    };

    const serverInput: AcceptSecurityContextInput = {
      credential: serverCred.credential,
    };
    let i = 0;
    while (true) {
      debug('i: ', i);
      i++;

      if (serverSecurityContext) {
        clientInput.SecBufferDesc = serverSecurityContext.SecBufferDesc;
        clientInput.contextHandle = clientSecurityContext?.contextHandle;
      }
      clientSecurityContext = sspi.InitializeSecurityContext(clientInput);
      debug('clientSecurityContext: ', clientSecurityContext);
      debug(hexDump(clientSecurityContext.SecBufferDesc.buffers[0]));
      if (
        clientSecurityContext.SECURITY_STATUS !== 'SEC_I_CONTINUE_NEEDED' &&
        clientSecurityContext.SECURITY_STATUS !== 'SEC_E_OK'
      ) {
        throw errorMsg;
      }

      serverInput.SecBufferDesc = clientSecurityContext.SecBufferDesc;
      if (serverSecurityContext) {
        serverInput.contextHandle = serverSecurityContext.contextHandle;
      }

      serverSecurityContext = sspi.AcceptSecurityContext(serverInput);
      debug('serverSecurityContext: ', serverSecurityContext);
      if (
        serverSecurityContext.SECURITY_STATUS !== 'SEC_I_CONTINUE_NEEDED' &&
        serverSecurityContext.SECURITY_STATUS !== 'SEC_E_OK'
      ) {
        if (serverSecurityContext.SECURITY_STATUS === 'SEC_E_LOGON_DENIED') {
          throw badLoginPasswordError;
        }
        throw errorMsg;
      }

      debug(hexDump(serverSecurityContext.SecBufferDesc.buffers[0]));
      if (serverSecurityContext.SECURITY_STATUS !== 'SEC_E_OK') {
        continue;
      }
      // we have the security context !!!
      debug('We have the security context !!!');
      break;
    }

    const sso = new SSO(serverSecurityContext.contextHandle, undefined);
    await sso.load();
    if (sso.user.name === 'Guest') {
      throw badLoginPasswordError;
    }
    return sso;
  } catch (e) {
    if (e === badLoginPasswordError) {
      throw e;
    }
    console.error('error', e);
    throw e;
  }
}
