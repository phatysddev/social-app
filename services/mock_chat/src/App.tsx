import { useEffect, useRef, useState } from "react";

interface ChatList {
  room_id: string;
  receiver: {
    username: string;
    user_id: string;
    avatar_url: string;
  };
  user: {
    username: string;
    user_id: string;
    avatar_url: string;
  };
  history: any[];
}

const App = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [chatList, setChatList] = useState<ChatList[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const userIdRef = useRef<string | null>(null);
  const usernameRef = useRef<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch("http://localhost:3001/loadroom", {
        credentials: "include",
      });
      const data = await response.json();
      setChatList(data);
      if (data !== null && data.length > 0) {
        userIdRef.current = data[0].user.user_id;
        usernameRef.current = data[0].user.username;
      }
    })();
  }, []);

  useEffect(() => {}, [messages]);

  useEffect(() => {
    if (chatList !== null && chatList.length > 0) {
      const socket = new WebSocket("ws://localhost:3001/ws");
      ws.current = socket;

      ws.current.onopen = () => {
        const initialRoom = chatList[0].room_id;
        setCurrentRoomId(initialRoom);
        ws.current?.send(
          JSON.stringify({
            type: "join",
            room_id: initialRoom,
          })
        );
        const his = chatList.find((v) => v.room_id === initialRoom);
        setMessages(() => {
          const userId = userIdRef.current;
          const format = his?.history === null ? [] : his?.history.map((v, i) => ({
            id: i,
            sender: v.SenderID === userId ? "Me" : "Other",
            content: v.Message,
            timestamp: new Date(v.Timestamp).toLocaleString(),
          }))

          return format?.reverse() || [];
        });
      };

      ws.current.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          const currentUserId = userIdRef.current;

          if (data.serder_id !== currentUserId) {
            setMessages((prev) => [
              ...prev,
              {
                id: prev.length + 1,
                sender: "Other",
                content: data.message,
                timestamp: new Date().toLocaleString(),
              },
            ]);
          }
        } catch (err) {
          console.error("Error parsing message:", ev.data);
        }
      };

      return () => {
        socket.close();
      };
    }
  }, [chatList]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const messageObj = {
      type: "message",
      room_id: currentRoomId,
      text: newMessage,
    };

    ws.current?.send(JSON.stringify(messageObj));

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: "Me",
        content: newMessage,
        timestamp: new Date().toLocaleString(),
      },
    ]);

    setNewMessage("");
  };

  const handleChatSelect = (roomId: string) => {
    if (!ws.current) return;

    if (currentRoomId) {
      ws.current.send(
        JSON.stringify({
          type: "leave",
          room_id: currentRoomId,
        })
      );
    }

    ws.current.send(
      JSON.stringify({
        type: "join",
        room_id: roomId,
      })
    );

    setCurrentRoomId(roomId);
    const his = chatList.find((v) => v.room_id === roomId);
    setMessages(() => {
      const userId = userIdRef.current;
      const format = his?.history === null ? [] : his?.history.map((v, i) => ({
        id: i,
        sender: v.SenderID === userId ? "Me" : "Other",
        content: v.Message,
        timestamp: new Date(v.Timestamp).toLocaleString(),
      }));

      return format?.reverse() || [];
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List */}
      <div className="w-1/5 bg-white border-r h-screen flex flex-col justify-start">
        <div className="p-4 bg-gray-800 text-white font-bold">Chats</div>
        <div className="overflow-y-auto h-full">
          {chatList?.map((chat) => (
            <div
              key={chat.room_id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                currentRoomId === chat.room_id ? "bg-blue-50" : ""
              }`}
              onClick={() => handleChatSelect(chat.room_id)}
            >
              <div className="flex justify-between items-start">
                <h3>{chat.receiver.username}</h3>
              </div>
              <p className="text-sm text-gray-500 truncate">{""}</p>
            </div>
          )) || <></>}
        </div>
      </div>

      {/* Chat Room */}
      <div className="w-4/5 flex flex-col">
        <div className="p-4 bg-white border-b font-bold">{usernameRef.current}</div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender === "Me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-lg p-3 rounded-lg ${
                  message.sender === "Me"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white border rounded-bl-none"
                }`}
              >
                <p className="break-all">{message.content}</p>
                <p className="text-xs mt-1 text-gray-400">
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}

          {/* ข้อความล่าสุด */}
          <div ref={messageEndRef} />
        </div>

        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              className="flex-1 border rounded-l-lg p-2 focus:outline-none"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white rounded-r-lg px-4 hover:bg-blue-600"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
