'use client'

import React, { useState } from 'react'
import { 
  QuestionMarkCircleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  LightBulbIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface HelpSection {
  title: string
  content: string
  type?: 'info' | 'tip' | 'warning'
}

interface HelpCardProps {
  title: string
  sections?: HelpSection[]
  description?: string
  children?: React.ReactNode
  defaultExpanded?: boolean
  className?: string
}

export default function HelpCard({ 
  title, 
  sections = [],
  description,
  children,
  defaultExpanded = false,
  className = ''
}: HelpCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const getIcon = (type: string = 'info') => {
    switch (type) {
      case 'tip':
        return <LightBulbIcon className="h-4 w-4 text-yellow-600" />
      case 'warning':
        return <QuestionMarkCircleIcon className="h-4 w-4 text-orange-600" />
      default:
        return <InformationCircleIcon className="h-4 w-4 text-blue-600" />
    }
  }

  const getColorClasses = (type: string = 'info') => {
    switch (type) {
      case 'tip':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center">
          <QuestionMarkCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6">
          {description && (
            <div className="mb-4">
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          )}
          
          {children ? (
            <div>{children}</div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getColorClasses(section.type)}`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getIcon(section.type)}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{section.title}</h4>
                      <p className="text-sm whitespace-pre-line">{section.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
