const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

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
    pass: "gmailPass1",
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

// exports.sendOrderEmail = functions.https.onCall((data) => {
//   console.log("Sending order summary email...", data);

// });

exports.sendEmail = functions.firestore
  .document("orders/{orderId}")
  .onCreate((snap, context) => {
    const mailOptions = {
      from: `stanleynyekpeye@gmail.com`,
      to: snap.data().email,
      subject: "New Order Confirmation",
      html: `<h3>Hello ${snap.data().customerName},</h3>
     <p>Thank you for choosing our platform.</p>
     <p>We are glad to inform you that your order with Order No: (${
       snap.data().orderNo
     }) has been confirmed successfully. Once approved, we'll let you know.</p>
     <p>Click <a href="https://www.dwecwinery.com/help">here</a> to learn more.</p>
     <br/>
     <p>You ordered for</p>
     <br />
     <br />
     <p>Regards From DWEC Winery</p>`,
    };

    transporter.sendMail(mailOptions, (error, data) => {
      if (error) {
        console.log(error);
        return;
      }
      console.log("Sent!");
    });
  });

exports.sendProductFCM = functions.firestore
  .document("products/{productId}")
  .onCreate((snap, context) => {
    const payload = {
      notification: {
        title: "New product added.",
        body: "Check out this product! ${snap.data().name}",
      },
      data: {
        body: snap.data(),
      },
    };

    admin
      .messaging()
      .send(payload)
      .then((response) => {
        console.log("SUCCESS::", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  });

{
  /* <ul>
  $
  {data.items?.map(
    (item, index) =>
      `<li>
         <span>${index + 1}</span>
         <h6>${item.name}</h6>
         <img src=${item.image} alt="" />
         <h6>${item.price}</h6>
         <h6>${item.quantity}</h6>
       </li>`
  )}
</ul>; */
}
