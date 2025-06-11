import { useState } from 'react'

const FilterBar = ({ value, onValueChange }) => {
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