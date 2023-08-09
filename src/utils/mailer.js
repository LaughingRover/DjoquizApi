/**=======================================================================
                                MAILER HELPER SERVICE
 ========================================================================*/

// IMPORTS
const nodemailer = require('nodemailer');

// constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// EXPORTS
module.exports.sendTemplate = sendTemplate;


function getEmailTemplate(_name = "New User", content = "#", template = "verify") {
  let templates = {
    "verify": `
  <body>
    <h3>You're almost there!</h3>
    <p>
        Hi <br>
        Kindly verify you own this email address by clicking the link below
    </p>
    <p>
      <a href="${content}">${content}</a>
    </p>
    <br/>
    <p><i>You're recieving this mail because you registered on our site with this email</i></p>
  </body>`,
    "resetpassword": `
    <body>
      <h3>Confirm it's you!</h3>
      <p>
          Hi <br>
          Someone (hopefully you) has requested a password reset on your account. 
          Kindly verify you initialized this request by clicking the link below
      </p>
      <p>
        <a href="${content}">${content}</a>
      </p>
      <br/>
      <p>Please take some time to secure your account if you did not make this request.</p>
    </body>`
  }

  return (
    `
      <!doctype html>
      <html>
          ${templates[template]}
      </html>
    `
  );
}

function getEmailSubjects(template = "verify") {
  return ({
    "verify": "Verify your email",
    "resetpassword": "Set your password"
  }[template]);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: 'premium219.web-hosting.com',
    port: 465,
    // secure: false,
    // tls: { servername: '/etc/djoyow.com' },
    //   tls.servername
    // port: 465,
    secure: true,
    auth: {
        user: 'no-reply@djoyow.com',
        pass: '4-{5Tg[.N_)0'
    }
});
}
// function getTransporter() {
//   return nodemailer.createTransport({
//     host: 'mail.djoyow.com',
//     port: 587,
//     auth: {
//         user: 'markus.labadie75@ethereal.email',
//         pass: 'FNG2qXUpJ1U6x2tUQv'
//     }
// });
// }

/**
 * sendTemplate sends an email from the email provided as the 'from' 
 * value of the config object to the email provided in the 'to' value of
 * the config object using the template specified as the 'template' value of
 * the config object 
 * @param {object} config object must contain a 'to' and 'from' values, 
 * @param {function} callback receives an err param
 */
function sendTemplate(config, callback) {

  if (!config || Object.keys(config).length === 0) {
    throw new Error("missing or invalid config object in sendTemplate")
  };

  if (!config.to || typeof (config.to) !== "string" || !EMAIL_REGEX.test(config.to)) {
    throw new Error("missing or invalid to value in config object in sendTemplate");
  }

  if (!config.from || typeof (config.from) !== "string" || !EMAIL_REGEX.test(config.from)) {
    throw new Error("missing or invalid from value in config object in sendTemplate");
  }

  if (!config.template || typeof (config.template) !== "string") {
    throw new Error("Please specify a valid template to use in config object of sendTemplate");
  }

  if (config.template !== "default" && config.template !== "resetpassword" && config.template !== "verify") {
    throw new Error("Please specify a valid template to use in config object of sendTemplate");
  }


  const transporter = getTransporter();
  const emailTemplate = getEmailTemplate(config.name, config.content, config.template);
  const emailSubject = getEmailSubjects(config.template);

  const mailOptions = {
    from: config.from,
    to: config.to,
    subject: emailSubject,
    html: emailTemplate
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return callback(error, null);
    }

    callback(null, info);
  });
}
