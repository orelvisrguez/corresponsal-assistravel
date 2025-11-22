import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Assistravel. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <span className="text-sm text-muted-foreground">
              Versión 1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
