import Keyv from "keyv";
import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

export const keyv = new Keyv(
  `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@discord-cluster-shard-00-00.80ng2.mongodb.net:27017,discord-cluster-shard-00-01.80ng2.mongodb.net:27017,discord-cluster-shard-00-02.80ng2.mongodb.net:27017/Bot?ssl=true&replicaSet=atlas-3z4u6h-shard-0&authSource=admin&retryWrites=true&w=majority`,
  { namespace: "sigaa" }
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.NODEMAILER,
  },
});

export const sendEmail = async (name) => {
  const mailOptions = {
    from: "Guilherme <guilhermeaugustodeoliveira66@gmail.com>",
    to: "guilhermeaugustodeoliveira66@gmail.com",
    subject: `Notas no SIGAA: ${name}`,
    html: `<h1>Notas atualizadas para ${name}</h1>`,
  };

  await transporter.sendMail(mailOptions);
};
