const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
// const cors = require("cors")({
//   origin: true,
// });

const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

var paystack = require("paystack")(
  "sk_test_06bb8656b799b97c7cfa6ce2dde731562f632c3d"
);

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "stanleynyekpeye@gmail.com",
    pass: "vfozyjsfcbaxnkfp",
  },
});

// const FCMToken = admin.database().ref(`/FCMTokens/${userId}`).once("value");

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
const addCustomer = functions.https.onRequest(async (userId, data) => {
  await admin
    .firestore()
    .collection(`paystack_customers`)
    .doc(`${userId}`)
    .set(data);
});

exports.createPaystackCustomer = functions.auth
  .user()
  .onCreate(async (user) => {
    const customer = await paystack.customer.create({
      email: user.email,
    });

    console.log("CUSTOMER DATA::", customer);

    const customerId = customer.data.id;
    const userId = user.uid;
    const customerCode = customer.data.customer_code;

    console.log("Customer ID", customerId);
    console.log("User ID", userId);

    const customerData = {
      fullName: "Paystack User",
      customerId: customerId,
      customerCode: customerCode,
      email: user.email,
      userId: userId,
    };

    addCustomer(user.uid, customerData).then((resp) => {
      console.log("New customer added :: ");
    });
  });

//Create User Payment Intent
exports.initializePayment = functions.https.onCall((data) => {
  //   console.log("Initializing payment...", data);

  return paystack.transaction.initialize({
    amount: data.amount,
    email: data.email,
  });
});

exports.verifyPayment = functions.https.onCall((reference) => {
  console.log("Verifying payment...", reference);
  return paystack.transaction.verify(reference);
});

exports.sendEmail = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    console.log("TORINO", JSON.stringify(snap.data()));

    let data = snap.data();
    let nItems = data.items;
    let itms = snap.data().items;
    const arrayOfResults = new Array();
    let arr = [
      {
        id: 1,
        image:
          "https://firebasestorage.googleapis.com/v0/b/dwec-df8f3.appspot.com/o/tmp-fold%2Fphoto-1557682204-e53b55fd750c-removebg-preview.png?alt=media&token=dd6e147f-1454-4187-a9db-4bd4f5fa21a7",
        name: "Diamond Bullet",
        category: "Champgne",
        cost: 50000,
        price: 25000,
        quantity: 2,
      },
      {
        id: 2,
        image:
          "https://firebasestorage.googleapis.com/v0/b/dwec-df8f3.appspot.com/o/tmp-fold%2Fphoto-1586370434639-0fe43b2d32e6-removebg-preview.png?alt=media&token=f6d33df1-b203-4f0b-804d-e9b047e284a8",
        name: "Balon Derie",
        category: "Wine",
        cost: 45000,
        price: 15000,
        quantity: 3,
      },
    ];

    // Object.keys(snap.data().items).forEach((val) => );

    const result = Object.keys(itms).map((key) => ({
      food: key,
      ...itms[key],
    }));

    console.log("Flattened result: ", result);

    var text = `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }
        td, th {
          border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;
        }
        tr:nth-child(even) {
          background-color: #dddddd;
        }
        </style>
      </head>
      <body>
        <div style="margin: 48px;" >
          <div style="border: 1px black solid; background-color: #9A031E" >
            <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;  height: 100px; background-image: url('https://firebasestorage.googleapis.com/v0/b/dwec-df8f3.appspot.com/o/assets%2Fimages%2Fpattern.svg?alt=media&token=d0ccd1ce-1581-4180-8a12-6eb0b5e92a88'); background-repeat: inherit; background-size: contain;" >
              <img style="margin: 0px auto;" src="https://firebasestorage.googleapis.com/v0/b/dwec-df8f3.appspot.com/o/assets%2Fimages%2Fsplash_logo.png?alt=media&token=3227e0da-0fa3-42ac-b493-425ebc4239af" alt="" />
            </div>
            <div style="background-color: white; display: flex; flex-direction: row; justify-content: space-evenly; justify-self: center; align-self: center; align-items: center;  padding: 16px; border-top: 1px black solid; border-bottom: 1px #9A031E solid;" >
              <a href="https://flutter.dev/" style="text-decoration: none; padding-right: 10px;" >Home </a>
              <a href="https://flutter.dev/" style="text-decoration: none; padding-left: 10px; padding-right: 10px;"> About </a>
              <a href="https://flutter.dev/" style="text-decoration: none; padding-left: 10px; padding-right: 10px;"> Contact </a>
              <a href="https://flutter.dev/" style="text-decoration: none; padding-left: 10px;"> Visit store </a>
            </div>
            <div style="padding: 24px; background-color: white;" >
              <p>Dear ${snap.data().customerName || ""}.</p>
              <p>Thank you for shopping on DWEC Winery!</p>
              <p>We are glad to inform you that your order <strong>${
                snap.data().orderNo || ""
              }</strong> has been confirmed successfully.</p>
              <div style="padding-bottom: 16px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;" >
                <div style="margin: 10px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div>
                      <h4>Delivery Type</h4>
                      <p>${snap.data().deliveryType || ""}</p>
                    </div>
                </div>
                <div style="margin: 10px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div>
                      <h4>Order Created On</h4>
                      <p>${new Date(
                        snap.data().createdAt?.seconds * 1000
                      ).toLocaleString("en-US")}</p>
                    </div>
                </div>
                <div style="margin: 10px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div>
                      <h4>Payment Method</h4>
                      <p>${snap.data().paymentMethod || ""}</p>
                    </div>
                </div>
                <div style="margin: 10px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div>
                      <h4>Status</h4>
                      <p>${snap.data().status || ""}</p>
                    </div>
                </div>
              </div>
              <hr />
              <p>You ordered for the following items:</p>
              <table>
                <tr>
                  <th>Image </th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
                ${Object.keys(itms)?.map(
                  (key) =>
                    `<tr>
                    <td>
                      <img src="${itms[key].image}" alt="" width="${108}" />
                    </td>
                    <td>${itms[key].name}</td>
                    <td>${itms[key].category}</td>
                    <td>${itms[key].price}</td>
                    <td>${itms[key].quantity}</td>
                    <td>${itms[key].cost}</td>
                  </tr>`
                )}
              </table>
              <br />
              <p>If you would like to know more, please visit our <a href="" >Help Center</a></p>
              <p>Happy Shopping! <br/>Warm Regards, <br/><br/><br/> DWEC Winery Team</p>
            </div>
          </div>
        </div>
      </body>
    </html>`;

    const mailOptions = {
      to: `${snap.data().email}`,
      from: "stanleynyekpeye@gmail.com",
      subject: `Your DWEC Winery Order ${
        snap.data().orderNo || ""
      } has been confirmed`,
      text: text,
      html: text,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("ON ERRORED", error.message);
        return 0;
      }

      console.log("Sent!", info.response);
      console.log("DE ERRO!", error.message);
    });

    // console.log("SdS!", nItems[0].cost);
    console.log("ITEMSS", ...snap.data()["items"]);
  });

exports.sendProductFCM = functions.firestore
  .document("products/{productId}")
  .onCreate((snap, context) => {
    // const userId = context.auth?.uid;

    console.log("Current Product name:: ", snap.data().name);

    const payload = {
      notification: {
        title: "New product added.",
        body: `Check out this product!`,
      },
      data: {
        body: "Hello world...",
      },
    };

    var fcmTokens = [];

    admin
      .firestore()
      .collection(`fcm_tokens`)
      .onSnapshot((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          fcmTokens.push(doc.data().tokens[0]);

          admin
            .messaging()
            .sendToDevice(doc?.data()?.tokens[0], payload)
            .then((response) => {
              console.log("SUCCESSFUL PUSH::", response);
            })
            .catch((error) => {
              console.log("Error sending message:", error);
            });
        });
        console.log("Current FCM Tokens : ", fcmTokens.join(", "));
      });
  });
