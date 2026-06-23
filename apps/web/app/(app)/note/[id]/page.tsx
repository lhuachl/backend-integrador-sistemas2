"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/store/auth";
import { client } from "@/lib/api/client";
import type { Note, NoteLink } from "@/lib/api/client";
import DarkVeil from "@/components/DarkVeil";
import AnimatedContent from "@/components/AnimatedContent";
import ScrollReveal from "@/components/ScrollReveal";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [backlinks, setBacklinks] = useState<NoteLink[]>([]);

  useEffect(() => {
    if (!id) return;
    client.getNote(id).then((n) => {
      setNote(n);
      if (n) {
        client.getNoteLinks(n.id).then(setLinks);
        client.getBacklinks(n.title).then(setBacklinks);
      }
    });
  }, [id]);

  if (!note) return null;

  const renderContent = (content: string) => {
    const parts = content.split(/(\[\[[^\]]+\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[[")) {
        const title = part.slice(2, -2);
        return (
          <span key={i} className="glass-chip px-1.5 py-0.5 rounded font-mono text-xs text-mauve mx-0.5 inline-block">
            [[{title}]]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 -z-10">
        <DarkVeil hueShift={290} />
      </div>

      <div className="p-6 max-w-3xl mx-auto">
        <AnimatedContent distance={20}>
          <Link href="/knowledge" className="font-mono text-[10px] uppercase tracking-wider text-overlay1 hover:text-mauve transition-colors mb-3 inline-block">
            ← /knowledge
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-[10px] text-overlay1">
            <span className="badge-soft badge-info">{note.author_id === user?.id ? "you" : "shared"}</span>
            {note.tags.map((tag) => (
              <span key={tag} className="badge-soft badge-mauve">#{tag}</span>
            ))}
          </div>
          <p className="font-mono text-[10px] text-overlay2 mb-6">
            {new Date(note.created_at).toLocaleDateString("es-ES")}
            {note.updated_at !== note.created_at && (
              <> · edited {new Date(note.updated_at).toLocaleDateString("es-ES")}</>
            )}
          </p>
        </AnimatedContent>

        <ScrollReveal>
          <article className="glass-card rounded-xl p-6 text-foreground text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {renderContent(note.content)}
          </article>
        </ScrollReveal>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.length > 0 && (
            <ScrollReveal>
              <section className="glass-card rounded-xl p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay1 mb-3 flex items-center gap-2">
                  <span className="dot dot-mauve" />
                  enlaces a →
                </h3>
                <div className="space-y-1.5">
                  {links.map((link) => (
                    <Link
                      key={link.id}
                      href={`/note/${link.source_note_id === note.id && link.target_note_id ? link.target_note_id : "#"}`}
                      className="block px-2 py-1.5 rounded font-mono text-xs text-overlay1 hover:text-mauve hover:bg-surface1/60 transition-colors"
                    >
                      → {link.target_title}
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {backlinks.length > 0 && (
            <ScrollReveal>
              <section className="glass-card rounded-xl p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay1 mb-3 flex items-center gap-2">
                  <span className="dot dot-info" />
                  referenciado desde ←
                </h3>
                <div className="space-y-1.5">
                  {backlinks.map((link) => (
                    <Link
                      key={link.id}
                      href={`/note/${link.source_note_id}`}
                      className="block px-2 py-1.5 rounded font-mono text-xs text-overlay1 hover:text-mauve hover:bg-surface1/60 transition-colors"
                    >
                      ← {link.target_title}
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  );
}