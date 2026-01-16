'use client'

interface Category {
  id: number
  name: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: number | null
  selectedPriority: number | null
  onCategoryChange: (categoryId: number | null) => void
  onPriorityChange: (priority: number | null) => void
}

const PRIORITIES = [
  { value: 1, label: 'High', color: 'bg-red-500' },
  { value: 2, label: 'Medium', color: 'bg-yellow-500' },
  { value: 3, label: 'Low', color: 'bg-green-500' },
]

export default function CategoryFilter({
  categories,
  selectedCategory,
  selectedPriority,
  onCategoryChange,
  onPriorityChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">Category</label>
        <select
          value={selectedCategory ?? ''}
          onChange={(e) =>
            onCategoryChange(e.target.value ? parseInt(e.target.value) : null)
          }
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">Priority</label>
        <div className="flex gap-2">
          <button
            onClick={() => onPriorityChange(null)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPriority === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {PRIORITIES.map((priority) => (
            <button
              key={priority.value}
              onClick={() => onPriorityChange(priority.value)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedPriority === priority.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${priority.color}`} />
              {priority.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
