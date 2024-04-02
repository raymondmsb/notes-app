import './App.css';
import React, {useEffect, useReducer} from 'react';
import { generateClient } from 'aws-amplify/api';
import {listNotes} from './graphql/queries';
import { v4 as uuid } from 'antd';
import { List, Input, Button } from 'antd';
import {createNote as CreateNote} from './graphql/mutations';

const initialState = {
  notes: [], 
  loading: true,
  error: false,
  form: { name: '', description: '' }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTES':
      return {
       ...state,
        notes: action.notes,
        loading: false
      };
    case 'ERROR':
      return {
       ...state,
        loading: false,
        error: true
      };
    default:
      return { ...state};
  }
};


function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = async() => {
    try {
      const client = generateClient();
      const notesData = await client.graphql({ query: listNotes });
      dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items });
    } catch (error) {
      dispatch({ type: 'ERROR' });
    }
  }

  const renderItem = (item) => {
    return (
      <List.Item style={styles.item}>
        <List.Item.Meta
          title={item.name}
          description={item.description}
        />
      </List.Item>
    );
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  const styles = {
    container: {padding: 20},
    input: {marginBottom: 10},
    item: { textAlign: 'left' },
    p: {color: '#1890ff'}
  }

  return (
    <div style={styles.container}>
      <List 
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
