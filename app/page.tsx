'use client'

import { useState, useCallback } from 'react'
import { useChatEngine } from '@/hooks/use-chat-engine'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatArea } from '@/components/chat/chat-area'
import { ChatInput } from '@/components/chat/chat-input'
import { SettingsDialog } from '@/components/chat/settings-dialog'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const {
    conversations,
    activeConversation,
    activeConversationId,
    settings,
    isGenerating,
    streamingContent,
    streamingThinking,
    selectedModel,
    models,
    modelsLoading,
    modelsError,
    setSelectedModel,
    updateSettings,
    newChat,
    switchConversation,
    deleteConversation,
    renameConversation,
    updateSystemPrompt,
    editMessage,
    sendMessage,
    stopGeneration,
    regenerateLastMessage,
    clearConversation,
    enableThinking,
    setEnableThinking,
    canThink,
    canVision,
  } = useChatEngine()

  const handleSend = useCallback(
    async (content: string, images?: string[]) => {
      await sendMessage(content, images)
    },
    [sendMessage]
  )

  const handleEdit = useCallback(
    (messageId: string, newContent: string) => {
      const updatedConv = editMessage(messageId, newContent)
      if (updatedConv) {
        sendMessage(newContent, updatedConv)
      }
    },
    [editMessage, sendMessage]
  )

  const handleSuggestionClick = useCallback(
    (text: string) => {
      sendMessage(text)
    },
    [sendMessage]
  )

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={newChat}
        onSwitchConversation={switchConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          modelsLoading={modelsLoading}
          modelsError={modelsError ? String(modelsError) : undefined}
          onOpenSidebar={() => setSidebarOpen(true)}
          onClearChat={clearConversation}
          hasMessages={(activeConversation?.messages.length ?? 0) > 0}
          conversationTitle={activeConversation?.title || 'New Chat'}
        />

        <ChatArea
          messages={activeConversation?.messages || []}
          isGenerating={isGenerating}
          streamingContent={streamingContent}
          streamingThinking={streamingThinking}
          hasModels={models.length > 0}
          onEdit={handleEdit}
          onRegenerate={regenerateLastMessage}
          onSuggestionClick={handleSuggestionClick}
        />

        <ChatInput
          onSend={handleSend}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          disabled={!selectedModel}
          enableThinking={enableThinking}
          onToggleThinking={setEnableThinking}
          canThink={canThink}
          canVision={canVision}
        />
      </main>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        systemPrompt={activeConversation?.systemPrompt || "You are Novexus, a friendly and smart AI Assistant. You have access to tools, so if a task needs ANY of the tools, you should absolutely use them without even thinking. If the user asks you to remember something or is talking about his life/projects, you can use the `memories` tool to store or retrieve memories. Talk like a member of Gen Z. Take a forward-thinking view. Tell it like it is; don't sugar-coat responses. Use quick and clever humor when appropriate. Be concise but helpful. Format your responses nicely with clear structure. Format your responses using Markdown for better readability. Use tables, code blocks, and proper formatting. You are runnning locally on the user's device."}
        onSaveSystemPrompt={updateSystemPrompt}
      />
    </div>
  )
}
