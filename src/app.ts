import express  from "express";
import "dotenv/config";
import { Server } from 'socket.io'
import http from 'http';
import cors from 'cors';

import { router } from "./routes";

const app = express();
app.use(cors());

const serverHttp = http.createServer(app);

const io = new Server(serverHttp, {
  cors: {
    origin: "*"
  }
});

io.on("connection", socket => {
  console.log(`Usuário conectado no socket ${socket.id}`)
});

app.use(express.json());

app.use(router);

app.get('/github', (req, res) => {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`);
})

app.get('/signin/callback', (req, res) => {
  const { code } = req.query;
  // o codigo do usuario vem na query
  return res.json(code);
})

export { serverHttp, io }

// app.listen(4000, () => {
//   console.log("Server is running on port 4000.")
// });

