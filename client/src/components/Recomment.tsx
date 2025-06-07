import { JSX, useState, MouseEvent } from "react";
import { IoIosNotifications, IoIosChatbubbles } from "react-icons/io";

import defaultProfile from "../assets/1741664792300-search.png";
import default2Profile from "../assets/1741615960378-facebook.png";
import ChatSmall from "./ChatSmall";
import NotificationSmall from "./NotificationSmall";
import RecommentAccout from "./RecommentAccout";

export interface ChatMock {
  username: string;
  last_message: string;
  readed: boolean;
  avatar: string;
}

export interface NotiMock {
  title: string;
  content: string;
  readed: boolean;
}

const chatMock: ChatMock[] = [
  {
    username: "Test_1",
    last_message: "Test message ok we go",
    readed: false,
    avatar: defaultProfile,
  },
  {
    username: "Test_2",
    last_message: "Test 2 message ok we go",
    readed: true,
    avatar: default2Profile,
  },
];

const notiMock: NotiMock[] = [];

export default function Recomment(): JSX.Element {
  const [chatNoti, setChatNoti] = useState<boolean>(true);

  const handleChatNoti = (e: MouseEvent<HTMLButtonElement>) => {
    const result: boolean = Boolean(
      parseInt(e.currentTarget.getAttribute("data-chat-noti") as string)
    );
    setChatNoti(result);
  };

  return (
    <div className="w-full h-full px-4 pt-4 bg-transparent flex flex-col justify-items-start items-center gap-4">

      {/* Chat and notification togger section */}

      <div className="w-full h-auto bg-white overflow-hidden rounded flex flex-col justify-start items-center transition-all">

        {/* Header chat and notification */}

        <div className="w-full h-[50px] bg-red-400 flex flex-row items-center justify-end gap-2">
          <button
            data-chat-noti={1}
            onClick={handleChatNoti}
            className={`${
              chatNoti ? "bg-gray-200" : "bg-white"
            } rounded transition-colors`}
          >
            <IoIosChatbubbles
              className={`w-[36px] h-[36px] ${
                chatNoti ? "text-red-500" : "text-red-400"
              } transition-colors`}
            />
          </button>
          <button
            data-chat-noti={0}
            onClick={handleChatNoti}
            className={`${
              !chatNoti ? "bg-gray-200" : "bg-white"
            } rounded transition-colors me-2`}
          >
            <IoIosNotifications
              className={`w-[36px] h-[36px] ${
                !chatNoti ? "text-red-500" : "text-red-400"
              } transition-colors`}
            />
          </button>
        </div>

        {/* Body chat and notification togger */}

        {chatNoti ? (
          <>
            {/* Body chat if chatNoti is true */}

            {chatMock.map((v) => (
              <ChatSmall person={v} />
            ))}

            {/* Footer chat */}

            <div className="w-full h-[32px] flex justify-start items-center">
              <p className="w-full text-center text-red-400 hover:text-red-500 transition-colors cursor-pointer">
                See more...
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Body notification if chatNoti is false */}

            {notiMock.map((_) => (
              <NotificationSmall />
            ))}

            {/* Footer notification */}

            <div className="w-full h-[32px] flex justify-start items-center">
              <p className="w-full text-center text-red-400 hover:text-red-500 transition-colors cursor-pointer">
                See more...
              </p>
            </div>
          </>
        )}
      </div>

      {/* Recomment account if user's login */}

      <div className="w-full bg-white overflow-hidden border-t-2 border-red-500 rounded flex flex-col justify-start items-center">

        {/* Header recomment account */}

        <div className="w-full h-[50px] bg-red-400 flex justify-start items-center">
          <h1 className="ms-2 font-extrabold text-white">Who to follow</h1>
        </div>

        {/* Body recomment account */}

        {<RecommentAccout />}

        {/* Footer recomment account */}

        <div className="w-full h-[32px] flex justify-start items-center">
          <p className="w-full text-center text-red-400 hover:text-red-500 transition-colors cursor-pointer">
            See more...
          </p>
        </div>
      </div>
    </div>
  );
}
