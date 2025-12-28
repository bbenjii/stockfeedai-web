export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="flex items-center justify-center h-10 px-4 text-xs text-gray-400 dark:bg-background-2">
            <span className="flex flex-wrap items-center gap-1">
                <span>© {year}</span>
                <span>•</span>
                <span>Built by</span>
                <a
                    href="https://benollomo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-200 transition-colors"
                >
                    Ben Ollomo
                </a>
            </span>
        </footer>
    );
}
