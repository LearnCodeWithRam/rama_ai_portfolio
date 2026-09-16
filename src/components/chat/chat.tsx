'use client';
import { useChat } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Component imports
import ChatBottombar from '@/components/chat/chat-bottombar';
import ChatLanding from '@/components/chat/chat-landing';
import ChatMessageContent from '@/components/chat/chat-message-content';
import { SimplifiedChatView } from '@/components/chat/simple-chat-view';
import { PresetReply } from '@/components/chat/preset-reply';
import { presetReplies } from '@/lib/config-loader';
import {
  ChatBubble,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import HelperBoost from './HelperBoost';

// ClientOnly component for client-side rendering
// @ts-expect-error ClientOnly intentionally accepts arbitrary React children.
const ClientOnly = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};

// Define Avatar component props interface
interface AvatarProps {
  hasActiveTool: boolean;
}

// Dynamic import of Avatar component
const Avatar = dynamic<AvatarProps>(
  () =>
    Promise.resolve(({ hasActiveTool }: AvatarProps) => {
      // Conditional rendering based on detection
      return (
        <div
          className={`ai-avatar-frame flex items-center justify-center rounded-full transition-all duration-300 ${hasActiveTool ? 'h-20 w-20' : 'h-28 w-28'}`}
        >
          <div
            className="ai-avatar-image relative cursor-pointer"
            onClick={() => (window.location.href = '/')}
          >
            <Image
              src="/avatar.png"
              alt="Avatar"
              width={112}
              height={112}
              className="h-full w-full object-contain object-[center_top] scale-105"
            />
          </div>
        </div>
      );
    }),
  { ssr: false }
);

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: 0.3,
    ease: 'easeOut' as const,
  },
};

const Chat = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [presetReply, setPresetReply] = useState<{
    question: string;
    reply: string;
    tool: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    stop,
    setInput,
    reload,
    addToolResult,
    append,
  } = useChat({
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
      }
    },
    onFinish: () => {
      setLoadingSubmit(false);
    },
    onError: (error) => {
      setLoadingSubmit(false);
      console.error('Chat error:', error.message, error.cause);
      
      // Handle specific error types
      if (error.message?.includes('quota') || error.message?.includes('exceeded') || error.message?.includes('429')) {
        // Show a friendly notification for quota issues
        toast.error('⚠️ AI provider limit reached. Please contact Ramanuj directly or use preset questions. Thank you for understanding! 🙏', {
          duration: 6000, // Show for 6 seconds
          style: {
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
        
        // Set error message state for frontend display
        setErrorMessage('quota_exhausted');
        
        // Try to add a chat bubble with the error message
        try {
          append({
            role: 'assistant',
            content: '⚠️ **AI provider limit reached**\n\nPlease contact Ramanuj directly or use preset questions below.',
          });
        } catch (appendError) {
          console.error('Failed to append error message:', appendError);
        }
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Error: ${error.message}`);
        setErrorMessage(`Error: ${error.message}`);
      }
    },
    onToolCall: (tool) => {
      const toolName = tool.toolCall.toolName;
      console.log('Tool call:', toolName);
    },
  });

  const { currentAIMessage, latestUserMessage, hasActiveTool } = useMemo(() => {
    const latestAIMessageIndex = messages.findLastIndex(
      (m) => m.role === 'assistant'
    );
    const latestUserMessageIndex = messages.findLastIndex(
      (m) => m.role === 'user'
    );

    const result = {
      currentAIMessage:
        latestAIMessageIndex !== -1 ? messages[latestAIMessageIndex] : null,
      latestUserMessage:
        latestUserMessageIndex !== -1 ? messages[latestUserMessageIndex] : null,
      hasActiveTool: false,
    };

    if (result.currentAIMessage) {
      result.hasActiveTool =
        result.currentAIMessage.parts?.some(
          (part) =>
            part.type === 'tool-invocation' &&
            part.toolInvocation?.state === 'result'
        ) || false;
    }

    if (latestAIMessageIndex < latestUserMessageIndex) {
      result.currentAIMessage = null;
    }

    return result;
  }, [messages]);

  const isToolInProgress = messages.some(
    (m) =>
      m.role === 'assistant' &&
      m.parts?.some(
        (part) =>
          part.type === 'tool-invocation' &&
          part.toolInvocation?.state !== 'result'
      )
  );

  // @ts-expect-error The chat SDK callback accepts the inferred message shape.
  const submitQuery = useCallback((query) => {
    if (!query.trim() || isToolInProgress) return;
    
    // Clear any previous error message
    setErrorMessage(null);
    
    // Check if this is a preset question first
    if (presetReplies[query]) {
      const preset = presetReplies[query];
      setPresetReply({ question: query, reply: preset.reply, tool: preset.tool });
      setLoadingSubmit(false);
      return;
    }
    
    setLoadingSubmit(true);
    setPresetReply(null); // Clear any preset reply when submitting new query
    append({
      role: 'user',
      content: query,
    });
  }, [append, isToolInProgress]);

  // @ts-expect-error The chat SDK callback accepts the inferred message shape.
  const submitQueryToAI = (query) => {
    if (!query.trim() || isToolInProgress) return;
    
    // Clear any previous error message
    setErrorMessage(null);
    
    // Force AI response, bypass preset checking
    setLoadingSubmit(true);
    setPresetReply(null);
    append({
      role: 'user',
      content: query,
    });
  };

  // @ts-expect-error The chat SDK callback accepts the inferred message shape.
  const handlePresetReply = (question, reply, tool) => {
    setPresetReply({ question, reply, tool });
    setLoadingSubmit(false);
  };

  // @ts-expect-error The chat SDK callback accepts the inferred message shape.
  const handleGetAIResponse = (question) => {
    setPresetReply(null);
    submitQueryToAI(question); // Use the new function that bypasses presets
  };

  useEffect(() => {
    if (initialQuery && !autoSubmitted) {
      setAutoSubmitted(true);
      setInput('');
      submitQuery(initialQuery);
    }
  }, [initialQuery, autoSubmitted, setInput, submitQuery]);

  // @ts-expect-error The form event is inferred by the chat composer callback.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isToolInProgress) return;
    submitQueryToAI(input); // User input should go directly to AI
    setInput('');
  };

  const handleStop = () => {
    stop();
    setLoadingSubmit(false);
  };

  // Check if this is the initial empty state (no messages)
  const isEmptyState =
    !currentAIMessage && !latestUserMessage && !loadingSubmit && !presetReply && !errorMessage;

  // Calculate header height based on hasActiveTool
  const headerHeight = hasActiveTool ? 100 : 180;

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="ai-network" aria-hidden="true">
        <div className="ai-network-grid" />
        <div className="ai-network-haze ai-network-haze-left" />
        <div className="ai-network-haze ai-network-haze-right" />
        <div className="ai-orbit ai-orbit-one" />
        <div className="ai-orbit ai-orbit-two" />
        <div className="ai-orbit ai-orbit-three" />
        <div className="ai-orbit ai-orbit-four" />
        <div className="ai-orbit ai-orbit-five" />
        <div className="ai-network-trace ai-network-trace-one" />
        <div className="ai-network-trace ai-network-trace-two" />
        <div className="ai-network-trace ai-network-trace-three" />
        <div className="ai-brain">
          <div className="ai-brain-lobe ai-brain-lobe-left" />
          <div className="ai-brain-lobe ai-brain-lobe-right" />
          <div className="ai-brain-core" />
          <span className="ai-brain-synapse ai-brain-synapse-one" />
          <span className="ai-brain-synapse ai-brain-synapse-two" />
          <span className="ai-brain-synapse ai-brain-synapse-three" />
          <span className="ai-brain-synapse ai-brain-synapse-four" />
          <span className="ai-brain-synapse ai-brain-synapse-five" />
          <span className="ai-brain-synapse ai-brain-synapse-six" />
        </div>
        <span className="ai-node ai-node-one" />
        <span className="ai-node ai-node-two" />
        <span className="ai-node ai-node-three" />
        <span className="ai-node ai-node-four" />
        <span className="ai-node ai-node-five" />
      </div>

      {/* Fixed Avatar Header with Gradient */}
      <div
        className="fixed top-0 right-0 left-0 z-50 ai-header"
      >
        <div
          className={`transition-all duration-300 ease-in-out ${hasActiveTool ? 'pt-6 pb-0' : 'py-6'}`}
        >
          <div className="flex justify-center">
            <ClientOnly>
              <Avatar
                hasActiveTool={hasActiveTool}
              />
            </ClientOnly>
          </div>

          <AnimatePresence>
            {latestUserMessage && !currentAIMessage && (
              <motion.div
                {...MOTION_CONFIG}
                className="mx-auto flex max-w-3xl px-4"
              >
                <ChatBubble variant="sent">
                  <ChatBubbleMessage>
                    <ChatMessageContent
                      message={latestUserMessage}
                      isLast={true}
                      isLoading={false}
                      reload={() => Promise.resolve(null)}
                    />
                  </ChatBubbleMessage>
                </ChatBubble>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 container mx-auto flex h-full max-w-3xl flex-col">
        {/* Scrollable Chat Content */}
        <div
          className="flex-1 overflow-y-auto px-2 pb-4"
          style={{ paddingTop: `${headerHeight}px` }}
        >
          <AnimatePresence mode="wait">
            {isEmptyState ? (
              <motion.div
                key="landing"
                className="flex min-h-full items-center justify-center"
                {...MOTION_CONFIG}
              >
                <ChatLanding 
                  submitQuery={submitQuery} 
                  handlePresetReply={handlePresetReply}
                />
              </motion.div>
            ) : presetReply ? (
              <div className="pb-4">
                <PresetReply
                  question={presetReply.question}
                  reply={presetReply.reply}
                  tool={presetReply.tool}
                  onGetAIResponse={handleGetAIResponse}
                  onClose={() => setPresetReply(null)}
                />
              </div>
            ) : errorMessage ? (
              <motion.div
                key="error"
                {...MOTION_CONFIG}
                className="px-4 pt-4"
              >
                <ChatBubble variant="received">
                  <ChatBubbleMessage className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="space-y-4 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                          <span className="text-white text-lg">⚠️</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                            API Quota Exhausted
                          </h3>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            AI provider limit reached
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                        <p>
                          The AI provider is temporarily unavailable, but you can still use the preset questions below.
                        </p>
                        
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg mt-3">
                          <p className="font-medium mb-2">What you can do:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Contact me directly for a live demo</li>
                            <li>Use the preset questions below for instant responses</li>
                            <li>Come back tomorrow when the quota resets</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setErrorMessage(null);
                            const preset = presetReplies["How can I reach you?"];
                            if (preset) {
                              setPresetReply({ 
                                question: "How can I reach you?", 
                                reply: preset.reply, 
                                tool: preset.tool 
                              });
                            }
                          }}
                          className="px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 transition-colors font-medium"
                        >
                          Contact me
                        </button>
                        <button
                          onClick={() => {
                            setErrorMessage(null);
                            window.location.href = '/';
                          }}
                          className="bg-muted hover:bg-muted/70 text-foreground rounded-md px-4 py-2 text-sm transition-colors"
                        >
                          Use Presets
                        </button>
                      </div>
                      
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-3">
                        Thank you for your patience! 🙏
                      </p>
                    </div>
                  </ChatBubbleMessage>
                </ChatBubble>
              </motion.div>
            ) : currentAIMessage ? (
              <div className="pb-4">
                <SimplifiedChatView
                  message={currentAIMessage}
                  isLoading={isLoading}
                  reload={reload}
                  addToolResult={addToolResult}
                />
              </div>
            ) : (
              loadingSubmit && (
                <motion.div
                  key="loading"
                  {...MOTION_CONFIG}
                  className="px-4 pt-18"
                >
                  <ChatBubble variant="received">
                    <ChatBubbleMessage isLoading />
                  </ChatBubble>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Bottom Bar */}
                        <div className="sticky bottom-0 bg-background/80 px-2 pt-3 backdrop-blur-md md:px-0 md:pb-4">
          <div className="relative flex flex-col items-center gap-3">
            <HelperBoost 
              submitQuery={submitQuery} 
              handlePresetReply={handlePresetReply}
            />
            <ChatBottombar
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={onSubmit}
              isLoading={isLoading}
              stop={handleStop}
              isToolInProgress={isToolInProgress}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;
