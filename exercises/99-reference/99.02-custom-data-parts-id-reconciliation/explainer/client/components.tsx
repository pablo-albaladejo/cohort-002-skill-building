import type { MyMessage } from '../api/chat.ts';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, MessageCircleOff } from 'lucide-react';

export const Wrapper = (props: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {props.children}
    </div>
  );
};

export const Message = ({
  role,
  parts,
}: {
  role: string;
  parts: MyMessage['parts'];
}) => {
  const prefix = role === 'user' ? 'User: ' : 'AI: ';

  const text = parts
    .map((part) => {
      if (part.type === 'text') {
        return part.text;
      }
      return '';
    })
    .join('');

  return (
    <div className="prose prose-invert my-6">
      <ReactMarkdown>{prefix + text}</ReactMarkdown>
      <div className="flex flex-col gap-2">
        {parts.map((part) => {
          if (part.type === 'data-hello') {
            return (
              <div
                key={part.id}
                className="flex items-center space-x-3"
              >
                <MessageCircle />
                <span>{part.data}</span>
              </div>
            );
          }
          if (part.type === 'data-goodbye') {
            return (
              <div
                key={part.id}
                className="flex items-center space-x-3"
              >
                <MessageCircleOff />
                <span>{part.data}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
}: {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <form onSubmit={onSubmit}>
    <input
      className="fixed bottom-0 w-full max-w-md p-2 mb-8 border-2 border-zinc-700 rounded shadow-xl bg-gray-800"
      value={input}
      placeholder="Say something..."
      onChange={onChange}
      autoFocus
    />
  </form>
);
