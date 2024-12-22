// frontend/src/components/DataComponent.js
import React, { useEffect, useState } from 'react';

const DataComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/data')  // Calls the API route from your backend
      .then(res => res.json())
      .then(data => {
        setData(data);
      });
  }, []);

  return (
    <div>
      <h1>Data from PostgreSQL</h1>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DataComponent;
