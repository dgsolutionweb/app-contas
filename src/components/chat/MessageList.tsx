import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { FlatList, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import type { ChatMessage, ConfirmPayload, Conta } from '../../types';
import { MessageBubble } from './MessageBubble';
import { useAppContext } from '../../context/AppContext';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  isProcessing?: boolean;
  onMarkPaid: (conta: Conta) => void;
  onConfirm: (payload: ConfirmPayload) => void;
  onCancel: () => void;
  onRefresh?: () => void;
}

export interface MessageListRef {
  scrollToEnd: () => void;
}

const MemoizedBubble = React.memo(MessageBubble);

export const MessageList = forwardRef<MessageListRef, Props>(
  function MessageList({ messages, isLoading, isProcessing, onMarkPaid, onConfirm, onCancel, onRefresh }, ref) {
    const { T } = useAppContext();
    const listRef = useRef<FlatList>(null);
    const [refreshing, setRefreshing] = useState(false);

    const renderItem = useCallback(
      ({ item }: { item: ChatMessage }) => (
        <MemoizedBubble
          message={item}
          onMarkPaid={onMarkPaid}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ),
      [onMarkPaid, onConfirm, onCancel]
    );

    const handleRefresh = async () => {
      setRefreshing(true);
      await onRefresh?.();
      setRefreshing(false);
    };

    useImperativeHandle(ref, () => ({
      scrollToEnd: () => listRef.current?.scrollToEnd({ animated: true }),
    }));

    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }, [messages.length]);

    if (isLoading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
          <ActivityIndicator color={T.accent}/>
        </View>
      );
    }

    return (
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: T.bg }}
        ListFooterComponent={
          isProcessing ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 24, paddingVertical: 14, gap: 10,
            }}>
              {/* Typing dots */}
              <View style={{
                backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border,
                paddingHorizontal: 14, paddingVertical: 10,
                flexDirection: 'row', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.textFaint }}/>
                ))}
              </View>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.accent}/>
        }
      />
    );
  }
);
