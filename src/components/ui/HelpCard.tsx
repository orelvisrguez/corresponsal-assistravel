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
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 rounded-t-2xl group"
      >
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
            <QuestionMarkCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-500 transform group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-500 transform group-hover:scale-110 transition-transform duration-300" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-8 pb-8">
          {children ? (
            <div>{children}</div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 ${getColorClasses(section.type)} shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        {getIcon(section.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-3 text-lg">{section.title}</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
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
