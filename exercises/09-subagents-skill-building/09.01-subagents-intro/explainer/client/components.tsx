import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { MyMessage } from '../api/chat.ts';
import type { Subagent } from './root.tsx';

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
}) => (
  <div className="my-4 space-y-2">
    <div className="text-sm text-gray-300">
      {role === 'user' ? 'User: ' : 'AI: '}
    </div>
    {parts.map((part) => {
      if (part.type === 'text') {
        return (
          <div className="text-gray-100 prose prose-invert">
            <ReactMarkdown>{part.text}</ReactMarkdown>
          </div>
        );
      }
    })}
  </div>
);

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  disabled,
  subagent,
  setSubagent,
}: {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  subagent: Subagent;
  setSubagent: (subagent: Subagent) => void;
}) => (
  <div className="fixed bottom-0 w-full max-w-md mb-8 shadow-xl">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center justify-end space-x-2 w-full">
        <h2 className="text-xs text-gray-300">Mode:</h2>
        <button
          onClick={() => setSubagent('todos-agent')}
          className={`px-3 py-1 rounded-md text-xs flex-shrink-0 ${
            subagent === 'todos-agent'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setSubagent('student-notes-manager')}
          className={`px-3 py-1 rounded-md text-xs flex-shrink-0 ${
            subagent === 'student-notes-manager'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Student Notes
        </button>
        <button
          onClick={() => setSubagent('song-finder-agent')}
          className={`px-3 py-1 rounded-md text-xs flex-shrink-0 ${
            subagent === 'song-finder-agent'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Song Finder
        </button>
        <button
          onClick={() => setSubagent('scheduler-agent')}
          className={`px-3 py-1 rounded-md text-xs flex-shrink-0 ${
            subagent === 'scheduler-agent'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Scheduler
        </button>
      </div>
    </div>
    <form onSubmit={onSubmit}>
      <input
        className={`w-full border-2 bg-gray-800 border-zinc-700 rounded p-2 text-sm${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        value={input}
        placeholder={
          disabled
            ? 'Please handle tool calls first...'
            : 'Say something...'
        }
        onChange={onChange}
        disabled={disabled}
        autoFocus
      />
    </form>
  </div>
);
