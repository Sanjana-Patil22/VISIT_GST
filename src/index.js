require("dotenv/config");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs");
const { isAuth } = require("./auth.js");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const accountSid = "AC6cfa4ef2817588a266d155fab4bacb99";
const authToken = "e82550fb7db595628f5bc52092700773";
const client = require("twilio")(accountSid, authToken);

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const dateObj = new Date();

mongoose.connect(
  "mongodb+srv://admin:admin@cluster0.ctup1.mongodb.net/UserData?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const DataSchemaemp = {
  email: String,
  password: String,
  name: String,
  phn: String,
  desig: String,
  empcode: String,
  role: String,
  status: String,
  Rtoken: String,
};
const userD = mongoose.model("User-Datas-Emp", DataSchemaemp);

const DataSchemauser = {
  email: String,
  password: String,
  name: String,
  phn: String,
  Rtoken: String,
};
const userC = mongoose.model("User-Datas-Client", DataSchemauser);

const AppointmentSchema = {
  clientid: String,
  empid: String,
  purpose: String,
  status: String,
  date: String,
};
const ongoingaptmt = mongoose.model(
  "Ongoing-Appointment-Datas",
  AppointmentSchema
);

const RequestSchema = {
  clientid: String,
  empid: String,
  purpose: String,
  status: String,
  date: String,
};
const requestD = mongoose.model("Request-Datas", RequestSchema);

const {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
  sendAccessToken,
} = require("./token.js");
const res = require("express/lib/response");
const req = require("express/lib/request");
const { sortBy } = require("lodash");

const server = express();
server.use(cookieParser());

server.use(
  cors({
    origin: ["http://localhost:3000", "https://visit-gst.pages.dev","https://visit-gst-3rq.pages.dev"],
    credentials: true,
  })
);

const getCurrentTime = () => {
  var currentTime = new Date();
  var currentOffset = currentTime.getTimezoneOffset();
  var ISTOffset = 330; // IST offset UTC +5:30

  var ISTTime = new Date(
    currentTime.getTime() + (ISTOffset + currentOffset) * 60000
  );
  return ISTTime;
};

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Login , Register User and Generating Refresh Token

server.post("/emp-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // username chk
    let user = await userD.findOne({ email: email });

    if (!user) return res.status(200).send({ error: "Employee doesnt exist" });

    //password chk
    const valid = await compare(password, user.password);

    if (valid) {
      const accesstok = createAccessToken(user.id);
      const refreshtok = createRefreshToken(user.id);

      user.Rtoken = refreshtok;
      await user.save();

      sendRefreshToken(res, refreshtok);
      sendAccessToken(res, req, accesstok, refreshtok);
    } else {
      return res.status(200).send({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/client-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // username chk
    let user = await userC.findOne({ email: email });

    if (!user) return res.status(200).send({ error: "User doesnt exist" });

    //password chk
    const valid = await compare(password, user.password);

    if (valid) {
      const accesstok = createAccessToken(user.id);
      const refreshtok = createRefreshToken(user.id);

      user.Rtoken = refreshtok;
      await user.save();

      sendRefreshToken(res, refreshtok);
      sendAccessToken(res, req, accesstok, refreshtok);
    } else {
      return res.status(200).send({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/book-appointment", async (req, res) => {
  const { empid, purpose, status, dateofapt } = req.body;

  try {
    const userId = isAuth(req);
    if (userId !== null) {
      try {
        if (true) {
          let apt = new ongoingaptmt({
            clientid: userId,
            empid: empid,
            purpose: purpose,
            status: status,
            date: dateofapt,
          });
          await apt.save();
          res.send({ message: "Appointment Booking Successful" });
        }
      } catch (err) {
        req.statusCode = 401;
        res.status(401).send({
          error: `${err.message}`,
        });
      }
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/book-request", async (req, res) => {
  const { empid, purpose, status } = req.body;

  try {
    const userId = isAuth(req);
    if (userId !== null) {
      try {
        if (true) {
          let apt = new requestD({
            clientid: userId,
            empid: empid,
            purpose: purpose,
            status: status,
            date: getCurrentTime(),
          });
          await apt.save();
          res.send({ message: "Request Send Successful" });
        }
      } catch (err) {
        req.statusCode = 401;
        res.status(401).send({
          error: `${err.message}`,
        });
      }
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/update-status-apt", async (req, res) => {
  const { id, status } = req.body;

  try {
    const userId = isAuth(req);
    if (userId !== null) {
      let apt = await ongoingaptmt.findById(id);
      let reqapt = await requestD.findById(id);
      if (apt !== null) {
        let doc1 = await ongoingaptmt.findOneAndUpdate(
          { _id: id },
          { status: status }
        );
        if (doc1 !== null) {
          res.send({ message: "Updated" });
        }
      } else if (reqapt !== null) {
        let doc1 = await requestD.findOneAndUpdate(
          { _id: id },
          { status: status }
        );
        if (doc1 !== null) {
          res.send({ message: "Updated" });
        }
      } else {
        res.send({ message: "Not Found" });
      }
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/update-status-emp", async (req, res) => {
  const { status } = req.body;

  try {
    const userId = isAuth(req);
    if (userId !== null) {
      let apt = await userD.findById(userId);

      let doc1 = await userD.findOneAndUpdate(
        { _id: userId },
        { status: status }
      );
      if (doc1 !== null) {
        res.send({ message: "Updated" });
      } else {
        res.send({ message: "Not Found Or Not Updated" });
      }
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/register-client", async (req, res) => {
  const { email, password, name, phn } = req.body;
  console.log(name);
  try {
    try {
      let user = await userC.findOne({ email: email });

      if (user) {
        return res.status(200).send({ error: "Client Already Exists" });
      }
      // const userId = isAuth(req);

      //user = await userD.findById(userId);

      if (true) {
        const hashedPassword = await hash(password, 10);

        user = new userC({
          email: email,
          password: hashedPassword,
          name: name,
          phn: phn,
        });
        await user.save();
        res.send({ message: "Registration Successful" });
      }
    } catch (err) {
      req.statusCode = 401;
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/register-emp", async (req, res) => {
  const { email, password, name, phn, desig, empcode, role, status } = req.body;

  try {
      let user = await userD.findOne({ email: email });

      if (user) {
        return res.status(200).send({ error: "Employee Already Exists" });
      }
      // const userId = isAuth(req);

      //user = await userD.findById(userId);
      const hashedPassword = await hash(password, 10);

      user = new userD({
        email: email,
        password: hashedPassword,
        name: name,
        phn: phn,
        desig: desig,
        empcode: empcode,
        status: status,
        role: role,
      });
      await user.save();
      res.send({ message: "Registration Successful" });
    } catch (err) {
      req.statusCode = 401;
      res.status(401).send({
        error: `${err.message}`,
      });
    }

});

server.post("/protected", async (req, res) => {});

server.post("/refreshtoken", async (req, res) => {
  const token = req.body.refreshtc;
  // If we don't have a token in our request
  if (!token) return res.send({ accesstoken: "1" });

  // We have a token, let's verify it!
  let payload = null;

  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.send({ accesstoken: err });
  }
  // token is valid, check if user exist
  let id = payload.userId;
  let user = await userD.findById(id);

  if (!user) return res.send({ accesstoken: "3" });
  // user exist, check if refreshtoken exist on user
  if (user.Rtoken !== token)
    return res.send({ error: "Invalid refresh token" });
  // token exist, create new Refresh- and accesstoken

  const accesstoken = createAccessToken(user.id);
  const refreshtoken = createRefreshToken(user.id);
  // update refreshtoken on user in db
  // Could have different versions instead!
  user.Rtoken = refreshtoken;
  user.save();
  // All good to go, send new refreshtoken and accesstoken
  sendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken, refreshtoken });
});

server.get("/get-emp", async (req, res) => {
  try {
    try {
      const userId = isAuth(req);
      if (userId !== null) {
        userD.find({}, function (err, datas) {
          res.send(datas);
        });
      }
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-client", async (req, res) => {
  try {
    try {
      const userId = isAuth(req);
      if (userId !== null) {
        userC.find({}, function (err, datas) {
          res.send(datas);
        });
      }
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-appointment", async (req, res) => {
  try {
    try {
      ongoingaptmt.find({}, function (err, datas) {
        res.send(datas);
      });
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

//IsAdmin

server.get("/type-check", async (req, res) => {
  try {
    const userId = isAuth(req);
    if (userId !== null) {
      let user = await userD.findById(userId);
      if (user.role === "admin") {
        return res.status(200).send("admin");
      } else if (user.role === "emp") {
        return res.status(200).send("emp");
      } else {
        return res.status(200).send("not found");
      }
    }
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/history-request", async (req, res) => {
  try {
    const userId = isAuth(req);
    var appointments = [];
    let user = await userD.findById(userId);
    if (user.role === "admin") {
      requestD.find({}, function (err, datas) {
        console.log(datas);
        if (datas == null) {
          res.send([]);
        }
        datas.forEach(async function (post) {
          let user = await userC.findById(post.clientid);
          let empuser = await userD.findById(post.empid);
          appointments.push({
            client_id: user._id,
            client_name: user.name,
            client_phn: user.phn,
            emp_id: empuser._id,
            emp_name: empuser.name,
            emp_code: empuser.empcode,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });

          if (appointments.length === datas.length) {
            res.send(appointments);
          }
        });
      });
    } else {
      var appointments = [];
      let user = await requestD.find({ empid: userId });
      if (user == null) {
        res.send("User not found");
      }
      user.forEach(async function (post) {
        if (post.empid == userId) {
          let user = await userC.findById(post.clientid);
          let empuser = await userD.findById(post.empid);
          appointments.push({
            client_id: user._id,
            client_name: user.name,
            client_phn: user.phn,
            emp_id: empuser._id,
            emp_name: empuser.name,
            emp_code: empuser.empcode,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });
        }
        if (appointments.length === user.length) {
          res.send(appointments);
        }
      });
    }
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/history-apt", async (req, res) => {
  try {
    const userId = isAuth(req);
    var appointments = [];
    let user = await userD.findById(userId);
    if (user.role === "admin") {
      ongoingaptmt.find({}, function (err, datas) {
        console.log(datas);
        if (datas == null) {
          res.send([]);
        }
        datas.forEach(async function (post) {
          let user = await userC.findById(post.clientid);
          let empuser = await userD.findById(post.empid);
          appointments.push({
            client_id: user._id,
            client_name: user.name,
            client_phn: user.phn,
            emp_id: empuser._id,
            emp_name: empuser.name,
            emp_code: empuser.empcode,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });

          if (appointments.length === datas.length) {
            res.send(appointments);
          }
        });
      });
    } else {
      var appointments = [];
      let user = await ongoingaptmt.find({ empid: userId });
      if (user == null) {
        res.send("User not found");
      }
      user.forEach(async function (post) {
        if (post.empid == userId) {
          let user = await userC.findById(post.clientid);
          let empuser = await userD.findById(post.empid);
          appointments.push({
            client_id: user._id,
            client_name: user.name,
            client_phn: user.phn,
            emp_id: empuser._id,
            emp_name: empuser.name,
            emp_code: empuser.empcode,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });
        }
        if (appointments.length === user.length) {
          res.send(appointments);
        }
      });
    }
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});


server.get("/call-marathi", async (req, res) => {
  try {
    const { text } = req.body;


    res.send(text);
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/call", async (req, res) => {
  try {
    let user = await ongoingaptmt.find({ empid: "62716f0a3a0c62a58a894203" });

    let x = user.map(async (u) => {
      let user = await userC.findById(u.clientid);
      return {
        userName: user.name,
        userPhn: user.phn,
      };
    });

    res.send(x);
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-emp-byid", async (req, res) => {
  try {
    const userId = isAuth(req);
    let user = await userD.findById(userId);
    res.send(user);
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-client-byid", async (req, res) => {
  try {
    const userId = isAuth(req);
    let user = await userC.findById(userId);
    res.send(user);
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-appointment-emp", async (req, res) => {
  try {
    const userId = isAuth(req);
    let user = await userD.findById(userId);

    try {
      var appointments = [];
      let user = await ongoingaptmt.find({ empid: userId });
      if (user.length == 0) {
        res.send([]);
      }
      user.forEach(async function (post) {
        if (post.empid == userId) {
          let user = await userC.findById(post.clientid);
          appointments.push({
            id: post._id,
            name: user.name,
            phn: user.phn,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });
        }
        if (appointments.length === user.length) {
          res.send(appointments);
        }
      });
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-appointment-client", async (req, res) => {
  try {
    const userId = isAuth(req);
    console.log("length");
    try {
      var appointments = [];
      let user = await ongoingaptmt.find({ clientid: userId });
      if (user.length == 0) {
        res.send([]);
      }

      user.forEach(async function (post) {
        if (post.clientid == userId) {
          let user = await userD.findById(post.empid);
          if (user == null) {
            res.send([]);
          }
          appointments.push({
            id: post._id,
            name: user.name,
            phn: user.phn,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });
        }

        if (appointments.length === user.length) {
          res.send(appointments);
        }
      });
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-request-emp", async (req, res) => {
  try {
    const userId = isAuth(req);
    let user = await userD.findById(userId);
    try {
      var appointments = [];
      let user = await requestD.find({ empid: userId });
      console.log(user);
      if (user.length == 0) {
        res.send([]);
      }
      user.forEach(async function (post) {
        if (post.empid == userId) {
          let user = await userC.findById(post.clientid);
          console.log(user.name);
          appointments.push({
            id: post._id,
            name: user.name,
            phn: user.phn,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });
        }
        if (appointments.length === user.length) {
          res.send(appointments);
        }
      });
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.get("/get-request-client", async (req, res) => {
  try {
    const userId = isAuth(req);
    try {
      var appointments = [];
      let user = await requestD.find({ clientid: userId });
      if (user.length == 0) {
        res.send([]);
      }
      user.forEach(async function (post) {
        if (post.clientid == userId) {
          let user = await userD.findById(post.empid);
          appointments.push({
            id: post._id,
            name: user.name,
            phn: user.phn,
            purpose: post.purpose,
            status: post.status,
            date: post.date,
          });
        }
        if (appointments.length === user.length) {
          res.send(appointments);
        }
      });
    } catch (err) {
      res.status(401).send({
        error: `${err.message}`,
      });
    }
  } catch (err) {
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/send-otp", async (req, res) => {
  const phn = req.body.phn;
  try {
    client.verify
      .services("VA8e111f8c9f32e3a055f6d40a65163b9a")
      .verifications.create({ to: phn, channel: "sms" })
      .then((verification) => res.status(200).send(verification.status));
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

server.post("/check-otp", async (req, res) => {
  const code = req.body.otp;
  const phn = req.body.phn;
  try {
    client.verify
      .services("VA8e111f8c9f32e3a055f6d40a65163b9a")
      .verificationChecks.create({ to: phn, code: code })
      .then((verification_check) =>
        res.status(200).send(verification_check.status)
      );
  } catch (err) {
    req.statusCode = 401;
    res.status(401).send({
      error: `${err.message}`,
    });
  }
});

// server.listen(process.env.PORT, function () {
//   console.log("server Active");
// });

server.listen(3000, function () {
  console.log("server Active Now on port " + process.env.PORT);
});
