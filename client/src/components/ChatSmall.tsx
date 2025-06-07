import { JSX } from "react";

import { ChatMock } from "./Recomment";

interface Props {
    person: ChatMock
}

export default function ChatSmall({ person }: Props): JSX.Element {
    return (
        <div className="w-full h-[50px] flex justify-start items-center overflow-hidden relative">
          {
            person.readed ? <></> : <div className="absolute w-6 h-6 -bottom-3 -left-3 bg-red-500 rotate-45"></div>
          }
          <div className="w-[42px] h-[42px] ms-2 shrink-0">
            <img className="w-full h-full" src={person.avatar} alt="profile" />
          </div>
          <div className="mx-2">
            <h1 className="font-extrabold">{person.username}</h1>
            <p className="text-gray-500 line-clamp-1">
              {person.last_message}
            </p>
          </div>
        </div>
    );
}