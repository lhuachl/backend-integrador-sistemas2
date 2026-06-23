import React from 'react';
import { View, Text as RNText, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from './Text';
import { catppuccin, spacing, typography } from '@/theme/catppuccin';

export interface MarkdownTextProps {
  content: string;
  onWikiLink?: (title: string) => void;
}

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;

function renderInline(text: string, keyPrefix: string, onWikiLink?: (title: string) => void): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  const combined = new RegExp(`(${WIKILINK_RE.source})|(${BOLD_RE.source})`, 'g');

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<RNText key={`${keyPrefix}-${i++}`}>{text.slice(lastIndex, match.index)}</RNText>);
    }

    if (match[1]) {
      const title = match[1].slice(2, -2).trim();
      nodes.push(
        <Pressable key={`${keyPrefix}-${i++}`} onPress={() => onWikiLink?.(title)}>
          <RNText style={styles.wikiLink}>{title}</RNText>
        </Pressable>,
      );
    } else if (match[2]) {
      const inner = match[2].slice(2, -2);
      nodes.push(<RNText key={`${keyPrefix}-${i++}`} style={styles.bold}>{inner}</RNText>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<RNText key={`${keyPrefix}-${i++}`}>{text.slice(lastIndex)}</RNText>);
  }

  return nodes;
}

export function MarkdownText({ content, onWikiLink }: MarkdownTextProps) {
  const router = useRouter();

  const handleWikiLink = (title: string) => {
    if (onWikiLink) {
      onWikiLink(title);
    }
  };

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList(key: string) {
    if (listItems.length === 0) return;
    blocks.push(
      <View key={key} style={styles.list}>
        {listItems.map((item, i) => (
          <View key={`${key}-${i}`} style={styles.listItem}>
            <RNText style={styles.bullet}>•</RNText>
            <RNText style={styles.listText}>
              {renderInline(item, `${key}-${i}`, handleWikiLink)}
            </RNText>
          </View>
        ))}
      </View>,
    );
    listItems = [];
  }

  lines.forEach((line, idx) => {
    const key = `block-${idx}`;

    if (line.startsWith('### ')) {
      flushList(`${key}-list`);
      blocks.push(
        <Text key={key} variant="small" bold style={styles.h3}>
          {line.slice(4)}
        </Text>,
      );
    } else if (line.startsWith('## ')) {
      flushList(`${key}-list`);
      blocks.push(
        <Text key={key} variant="body" bold style={styles.h2}>
          {line.slice(3)}
        </Text>,
      );
    } else if (line.startsWith('# ')) {
      flushList(`${key}-list`);
      blocks.push(
        <Text key={key} variant="h3" bold style={styles.h1}>
          {line.slice(2)}
        </Text>,
      );
    } else if (line.match(/^\s*[-*]\s/)) {
      listItems.push(line.replace(/^\s*[-*]\s/, ''));
    } else if (line.trim() === '') {
      flushList(`${key}-list`);
      blocks.push(<View key={key} style={styles.spacer} />);
    } else {
      flushList(`${key}-list`);
      blocks.push(
        <RNText key={key} style={styles.paragraph}>
          {renderInline(line, key, handleWikiLink)}
        </RNText>,
      );
    }
  });

  flushList('final-list');

  return <View style={styles.container}>{blocks}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  h1: {
    marginTop: spacing[2],
  },
  h2: {
    marginTop: spacing[2],
  },
  h3: {
    marginTop: spacing[1.5],
    color: catppuccin.mocha.overlay2,
  },
  paragraph: {
    ...typography.body,
    color: catppuccin.mocha.text,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
    color: catppuccin.mocha.text,
  },
  wikiLink: {
    color: catppuccin.mocha.lavender,
    textDecorationLine: 'underline',
  },
  list: {
    gap: spacing[1],
    paddingLeft: spacing[1],
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  bullet: {
    color: catppuccin.mocha.overlay1,
    lineHeight: 24,
  },
  listText: {
    ...typography.body,
    color: catppuccin.mocha.text,
    lineHeight: 24,
    flex: 1,
  },
  spacer: {
    height: spacing[1],
  },
});
