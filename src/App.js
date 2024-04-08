import './App.css';
import React, {useEffect, useReducer} from 'react';
import { generateClient } from 'aws-amplify/api';
import {listNotes} from './graphql/queries';
import { v4 as uuid } from 'uuid';
import { List, Input, Button } from 'antd';
import { createNote as CreateNote, deleteNote as DeleteNote, updateNote as UpdateNote } from './graphql/mutations';

const CLIENT_ID = uuid();

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
    case 'ADD_NOTE':
      return {
       ...state,
        notes: [...state.notes, action.note],
        loading: false
      };
    case 'RESET_FORM':
      return {
       ...state,
        form: initialState.form
      };
    case 'SET_INPUT':
      return {
       ...state,
        form: {
         ...state.form,
          [action.name]: action.value
        }
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
      <List.Item style={styles.item} actions={[
        <>
        <p style={styles.p} onClick={()=>deleteNote(item)}>Delete</p>
        <p style={styles.p} onClick={()=>updateNote(item)}>{item.completed ? 'completed' : 'mark completed'}</p>
        </>
      ]}>
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

  const createNote = async() => {
    const { form } = state;
    if (!form.name || !form.description) {
      return alert('please enter a name and description')
    }
    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() }
    dispatch({ type: 'ADD_NOTE', note })
    dispatch({ type: 'RESET_FORM' })
    try {
      const client = generateClient();
      await client.graphql({
        query: CreateNote,
        variables: { input: note }
      })
      console.log('successfully created note')
    } catch (err) {
      console.error("error: ", err)
    }
  }

  const deleteNote = async({ id }) => {
    const index = state.notes.findIndex(n => n.id === id);
    const notes = [
      ...state.notes.slice(0, index),
      ...state.notes.slice(index + 1)
    ];
    dispatch({ type: 'SET_NOTES', notes })
    try {
      const client = generateClient();
      client.graphql({
        query: DeleteNote,
        variables: { input: { id } }
      })
      console.log('successfully deleted note!');
    } catch (err) {
      console.error("error: ", err);
    }
  };

  const updateNote = async(note) => {
  const index = state.notes.findIndex(n => n.id === note.id);
    const notes = [
      ...state.notes
    ];
    notes[index].completed = !note.completed;
    dispatch({ type: 'SET_NOTES', notes })
    try {
      const client = generateClient();
      client.graphql({
        query: UpdateNote,
        variables: { input: { id: note.id, completed: notes[index].completed } }
      })
      console.log('successfully updated note!');
    } catch (err) {
      console.error("error: ", err);
    }
  };

  const onChange = (e) => {
    dispatch({ type: 'SET_INPUT', name: e.target.name, value: e.target.value })
  };

  return (
    <div style={styles.container}>
      <Input 
        onChange={onChange}
        value={state.form.name}
        placeholder='Note Name'
        name='name'
        style={styles.input}
      />
      <Input 
        onChange={onChange}
        value={state.form.description}
        placeholder='Note Description'
        name='description'
        style={styles.input}
      />
      <Button
        onClick={createNote}
        type="primary"
      >
        Create Note
      </Button>
      <List 
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
