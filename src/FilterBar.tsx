import { useState } from 'react'

interface FilterBarProps {
  value: string;
  onValueChange: (value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ value, onValueChange }) => {
  const [inputValue, setInputValue] = useState(value ?? '')

  return (
    <div className='filter-bar'>
      <form>
        <label>
          <input
            type='text'
            value={inputValue}
            onChange={({ target }) => setInputValue(target.value)}
          />
        </label>
        <input type='button' value='Filter' onClick={() => onValueChange(inputValue)} />
      </form>
    </div>
  )
}

export default FilterBar 