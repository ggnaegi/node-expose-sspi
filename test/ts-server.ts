import express = require("express");
import sspi = require("..");

// global.debug = true;

const app = express();

app.use(sspi.ssoAuth({ toto: 123 }));


app.use((req, res, next) => {
  res.json({
    sso: req.sso
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));
