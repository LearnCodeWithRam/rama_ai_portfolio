// src/components/chat/chat-bottombar.tsx
'use client';

import { ChatRequestOptions } from 'ai';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';

interface ChatBottombarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  stop: () => void;
  input: string;
  isToolInProgress: boolean;
}

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  isToolInProgress,
}: ChatBottombarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      !e.nativeEvent.isComposing &&
      !isToolInProgress &&
      input.trim()
    ) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-2 md:pb-8"
    >
      {(isLoading || isToolInProgress) && (
        <div
          className="mb-2 flex items-center justify-center gap-2 px-4 text-sm text-slate-600 dark:text-slate-300"
          role="status"
          aria-live="polite"
        >
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500" />
          </span>
          <span>
            {isToolInProgress
              ? 'Gathering the most relevant details...'
              : 'Thinking through your question...'}
          </span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative w-full md:px-4">
        <div className="mx-auto flex items-center rounded-full border border-slate-200 bg-slate-100 py-2 pr-2 pl-6 dark:border-slate-700 dark:bg-slate-800">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={
              isToolInProgress
                ? 'Gathering details...'
                : isLoading
                  ? 'Preparing your answer...'
                  : 'Ask me anything'
            }
            className="text-md w-full border-none bg-transparent text-slate-950 placeholder:text-slate-600 focus:outline-none dark:text-white dark:placeholder:text-slate-300"
            disabled={isToolInProgress || isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim() || isToolInProgress}
            className="flex items-center justify-center rounded-full bg-[#0171E3] p-2 text-white disabled:opacity-50"
            onClick={(e) => {
              if (isLoading) {
                e.preventDefault();
                stop();
              }
            }}
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
