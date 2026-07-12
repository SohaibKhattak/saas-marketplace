import * as React from "react"

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Loader({ className, ...props }: LoaderProps) {
    return (
        <div className="loader border-t-2 rounded-full border-gray-500 bg-gray-300 animate-spin
aspect-square w-8 flex justify-center items-center text-yellow-700 "></div>
    )
}