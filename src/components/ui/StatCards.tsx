'use client'

import React from 'react'
import { StatCard } from '@/types'

interface StatCardsProps {
  stats: StatCard[]
}

export default function StatCards({ stats }: StatCardsProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-100'
      case 'green':
        return 'text-green-600 bg-green-100'
      case 'purple':
        return 'text-purple-600 bg-purple-100'
      case 'red':
        return 'text-red-600 bg-red-100'
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100'
      case 'indigo':
        return 'text-indigo-600 bg-indigo-100'
      case 'orange':
        return 'text-orange-600 bg-orange-100'
      case 'gray':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (stats.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const colorClasses = getColorClasses(stat.color)
        
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${colorClasses}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
