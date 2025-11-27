'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  className
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background-card rounded-t-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-slide-up',
          className
        )}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {title && (
          <div className="px-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
        )}

        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  )
}
