export default function Logo() {
    return (
        <div className="flex items-center gap-2 px-3 py-1 w-fit rounded-md select-none">
            <img
                src="/candlestick.svg"
                alt="stockfeedai logo"
                className="h-10 w-auto"
            />
            <span className="text-lg font-semibold tracking-tight text-foreground">
                stocksfeed
                <span className="text-muted-foreground">.ai</span>
            </span>
        </div>
    )
}