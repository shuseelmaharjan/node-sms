import type { JSONContent } from "@tiptap/react";

export type BlogEntity = {
  id: string;
  serial?: number;
  title: string;
  content: string;
  author: string;
  published_at: string;
  updated_at?: string;
};

export type BlogFormEntity = {
  title: string;
  content: JSONContent | null;
  author: string;
  published_at: string;
};