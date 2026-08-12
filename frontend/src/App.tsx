import { useEffect, useState } from "react";
import { loadStories } from "./api";
import Home from "./screens/Home";
import NarratorView from "./screens/NarratorView";
import StoryPicker from "./screens/StoryPicker";
import { getUsedStoryIds, markStoryUsed, resetUsedStories } from "./state/gameStorage";
import type { Story, StoryList } from "./types";

type Screen = "home" | "picker" | "narrator";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [storyList, setStoryList] = useState<StoryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedIds, setUsedIds] = useState<string[]>(getUsedStoryIds());
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  useEffect(() => {
    loadStories()
      .then(setStoryList)
      .finally(() => setLoading(false));
  }, []);

  function handlePick(story: Story) {
    setActiveStory(story);
    setScreen("narrator");
  }

  function handleFinishStory() {
    if (activeStory) {
      markStoryUsed(activeStory.id);
      setUsedIds(getUsedStoryIds());
    }
    setActiveStory(null);
    setScreen("picker");
  }

  function handleResetUsed() {
    resetUsedStories();
    setUsedIds([]);
  }

  return (
    <div className="app-shell">
      {screen === "home" && (
        <Home
          loading={loading}
          storyList={storyList}
          usedCount={usedIds.length}
          onPlay={() => setScreen("picker")}
          onResetUsed={handleResetUsed}
        />
      )}

      {screen === "picker" && storyList && (
        <StoryPicker
          stories={storyList.stories}
          usedIds={usedIds}
          onPick={handlePick}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "narrator" && activeStory && (
        <NarratorView story={activeStory} onFinish={handleFinishStory} />
      )}
    </div>
  );
}

export default App;
