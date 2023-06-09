import mongoose from 'mongoose';
import express from 'express';
import cors = require('cors');
import config from './config';
import usersRouter from './routers/Users';
import CategoriesRouter from './routers/Categories';
import DealsRouter from './routers/Deals';
import expressWs from 'express-ws';
import { ActiveConnections, dealType, IncomingMessage, MessageType } from './types';
import Message from './models/Message';
import User from './models/User';
import Deal from './models/Deal';

const app = express();
expressWs(app);
app.use(express.static('public'));
app.use(cors());
const router = express.Router();
const activeConnections: ActiveConnections = {};
const port = 8000;
app.use(express.json());
app.use('/users', usersRouter);
app.use('/categories', CategoriesRouter);
app.use('/deals', DealsRouter);
app.use(router);
const run = async () => {
  mongoose.set('strictQuery', false);
  await mongoose.connect(config.db);
  app.listen(port, () => {
    console.log(`Server started on ${port} port!`);
  });
  process.on('exit', () => {
    mongoose.disconnect();
  });
};

router.ws('/chat/:room/:id', async (ws, req) => {
  const { room } = req.params;
  const { id } = req.params;
  console.log('connected ' + id);
  if (!activeConnections[room]) {
    activeConnections[room] = {};
  }
  activeConnections[room][id] = ws;
  const messages = await Message.find({
    $or: [
      { room, whisper: false },
      { room, whisper: true, author: id },
      {
        room,
        whisper: true,
        to: id,
      },
    ],
  })
    .sort({ date: 1 })
    .limit(30)
    .populate('author to', 'displayName');
  ws.send(
    JSON.stringify({
      type: 'EXISTING_MESSAGES',
      payload: messages,
    }),
  );
  ws.on('close', () => {
    console.log(`Client disconnected! id=${id}, room=${room}`);
    delete activeConnections[room][id];
  });
  ws.on('message', async (msg) => {
    const decodedMessage = JSON.parse(msg.toString()) as IncomingMessage;
    switch (decodedMessage.type) {
      case 'SEND_NUMBER':
        try {
          const deal = (await Deal.findById(room)) as dealType;
          const messagePayload = decodedMessage.payload as MessageType;
          const author = await User.findById(messagePayload.author);
          const receiver = await User.findById(messagePayload.to);
          if (JSON.stringify(deal.owner) === JSON.stringify(messagePayload.author)) {
            const whisperMessage = new Message({
              author: messagePayload.author,
              text: 'Меня заинтересовало ваше предложение мой номер : ' + messagePayload.text,
              room,
              to: messagePayload.to,
              date: Date.now(),
              whisper: true,
            });
            await whisperMessage.save();
            activeConnections[room][messagePayload.author].send(
              JSON.stringify({
                type: 'NEW_MESSAGE',
                payload: {
                  room,
                  author: author,
                  to: receiver,
                  text: 'Меня заинтересовало ваше предложение мой номер : ' + messagePayload.text,
                  date: Date.now(),
                  whisper: true,
                },
              }),
            );
            activeConnections[room][messagePayload.to].send(
              JSON.stringify({
                type: 'NEW_MESSAGE',
                payload: {
                  room,
                  author: author,
                  to: receiver,
                  text: 'Меня заинтересовало ваше предложение мой номер : ' + messagePayload.text,
                  date: Date.now(),
                  whisper: true,
                },
              }),
            );
          }
        } catch (error) {
          ws.send(JSON.stringify(error));
        }
        break;
      case 'SEND_MESSAGE':
        try {
          const messagePayload = decodedMessage.payload as MessageType;
          const message = new Message({
            date: Date.now(),
            author: messagePayload.author,
            text: messagePayload.text,
            room,
          });
          await message.save();
          const author = await User.findOne({ _id: messagePayload.author });
          Object.keys(activeConnections[room]).forEach((connId) => {
            const conn = activeConnections[room][connId];
            conn.send(
              JSON.stringify({
                type: 'NEW_MESSAGE',
                payload: {
                  author: author,
                  text: messagePayload.text,
                  date: messagePayload.date,
                },
              }),
            );
          });
        } catch (error) {
          ws.send(JSON.stringify(error));
        }
        break;
    }
  });
});

run().catch(console.error);
