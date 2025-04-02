import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Board from "../TaskManager/Board";
import styles from "./TaskManager.module.scss";

const App = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.taskManager}>
        <Board />
      </div>
    </DndProvider>
  );
};

export default App;
