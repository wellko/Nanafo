import React, { useEffect, useRef, useState } from 'react';
import { MessageType } from '../../../types';
import { useAppSelector } from '../../../app/hooks';
import { selectUser } from '../../../features/users/UsersSlice';
import { useParams } from 'react-router-dom';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import MessageForm from './MessageForm';
import dayjs from 'dayjs';
import { selectDeal } from '../../../features/deals/DealsSlice';

const Chat = () => {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const user = useAppSelector(selectUser);
  const { id } = useParams();
  const deal = useAppSelector(selectDeal);

  const author = user?._id === deal?.owner._id;

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket('ws://localhost:8000/chat/' + id + '/' + user?._id);
      ws.current.onclose = () => {
        connect();
      };
      ws.current.onmessage = (event) => {
        const decodedMessage = JSON.parse(event.data);
        if (decodedMessage.type === 'EXISTING_MESSAGES') {
          decodedMessage.payload as MessageType[];
          setMessages(decodedMessage.payload.reverse());
        }
        if (decodedMessage.type === 'NEW_MESSAGE') {
          decodedMessage.payload as MessageType;
          setMessages((prevState) => [decodedMessage.payload, ...prevState]);
        }
      };
    };
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const MessageSender = (arg: string) => {
    if (!ws.current) return;
    ws.current.send(
      JSON.stringify({
        type: 'SEND_MESSAGE',
        payload: {
          author: user?._id,
          text: arg,
        },
      }),
    );
  };

  const WhisperSender = (to: string) => {
    if (!ws.current) return;
    ws.current.send(
      JSON.stringify({
        type: 'SEND_NUMBER',
        payload: {
          author: user?._id,
          text: user?.phoneNumber,
          to: to,
        },
      }),
    );
  };

  return (
    <div className="chat-main">
      <Grid
        item
        xs={8}
        height="700px"
        sx={{ overflowY: 'scroll', overflowWrap: 'break-word' }}
        className="chat-container"
      >
        {messages.map((el) => (
          <Paper sx={{ mb: 2 }} elevation={1} key={Math.random()}>
            <Grid sx={{ overflow: 'hidden' }} container justifyContent="space-between">
              {el.whisper ? (
                <Typography sx={{ wordWrap: 'break-word' }}>
                  {dayjs(el.date).format('YYYY-MM-DD HH:mm')} <br /> <b>{el.author.displayName}:</b> {el.text}
                </Typography>
              ) : (
                <>
                  <Typography sx={{ wordWrap: 'break-word' }}>
                    {dayjs(el.date).format('YYYY-MM-DD HH:mm')} <br /> <b>{el.author.displayName} eto ne whisper:</b>{' '}
                    {el.text}
                  </Typography>
                  {author && el.author._id !== user!._id && (
                    <Button
                      onClick={() => {
                        WhisperSender(el.author._id);
                      }}
                    >
                      отправить свой номер
                    </Button>
                  )}
                </>
              )}
            </Grid>
          </Paper>
        ))}
      </Grid>
      <Box sx={{ position: 'sticky', bottom: '0px', left: '0px', width: '100%', zIndex: '99', bgcolor: 'FFF' }}>
        <MessageForm submitFormHandler={MessageSender} />
      </Box>
    </div>
  );
};

export default Chat;
