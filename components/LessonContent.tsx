import ReactMarkdown from 'react-markdown'

export function LessonContent({ content }: { content: string }) {
  return (
    <div className="prose-lesson">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2>{children}</h2>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ children }) => <code>{children}</code>,
          pre: ({ children }) => <pre>{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
