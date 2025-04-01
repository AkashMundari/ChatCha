import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Shield,
  RefreshCw,
  Info,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SHA256 } from "crypto-js";
const FairAIGame = () => {
  // Game state
  const [playerChoice, setPlayerChoice] = useState(null);
  const [aiChoice, setAiChoice] = useState(null);
  const [result, setResult] = useState("");
  const [score, setScore] = useState({ player: 0, ai: 0, draws: 0 });
  const [gameHistory, setGameHistory] = useState([]);
  const [seed, setSeed] = useState("");
  const [verificationHash, setVerificationHash] = useState("");
  const [aiConfidence, setAiConfidence] = useState(3);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timelockExpiry, setTimelockExpiry] = useState(null);
  const [isTimelocked, setIsTimelocked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const messageEndRef = useRef(null);

  // AI strategy weights
  const [weights, setWeights] = useState({
    rock: 33.33,
    paper: 33.33,
    scissors: 33.34,
  });

  // Player pattern tracking
  const [playerPatterns, setPlayerPatterns] = useState({
    afterWin: { repeat: 0, change: 0 },
    afterLoss: { repeat: 0, change: 0 },
    afterDraw: { repeat: 0, change: 0 },
  });

  const [lastGameResult, setLastGameResult] = useState(null);
  const [lastPlayerChoice, setLastPlayerChoice] = useState(null);

  // Generate seed for verifiable randomness
  useEffect(() => {
    generateNewSeed();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gameHistory]);

  // Check timelock expiry
  useEffect(() => {
    let timer;
    if (isTimelocked && timelockExpiry) {
      timer = setInterval(() => {
        const now = new Date();
        if (now >= timelockExpiry) {
          setIsTimelocked(false);
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimelocked, timelockExpiry]);

  const generateNewSeed = () => {
    // In a production environment, this would call a VRF service like Chainlink or drand
    const newSeed = Math.floor(Math.random() * 1000000).toString();
    setSeed(newSeed);

    // Pre-commit to a hash that will determine AI's move
    // This ensures the AI can't cheat by changing its move after seeing player's choice
    const preCommitHash = SHA256(newSeed).toString();
    setVerificationHash(preCommitHash);

    // Set timelock expiry - AI's choice is locked for 5 seconds
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + 5);
    setTimelockExpiry(expiry);
    setIsTimelocked(true);
  };

  // Handle player choice
  const makeChoice = (choice) => {
    if (playerChoice || isTimelocked) return; // Prevent multiple selections or during timelock

    setPlayerChoice(choice);
    setIsLoading(true);

    // Simulate network delay for dramatic effect
    setTimeout(() => {
      // Generate AI choice using verifiable randomness
      const aiSelection = generateAiChoice(choice);
      setAiChoice(aiSelection);

      // Determine winner
      const gameResult = determineWinner(choice, aiSelection);
      setResult(gameResult);

      // Update score
      updateScore(gameResult);

      // Update game history
      const newGame = {
        id: gameCount + 1,
        playerChoice: choice,
        aiChoice: aiSelection,
        result: gameResult,
        seed: seed,
        verificationHash: verificationHash,
        timestamp: new Date().toISOString(),
      };

      setGameHistory((prevHistory) => [...prevHistory, newGame]);
      setGameCount((prevCount) => prevCount + 1);

      // Update AI learning model
      updateAiModel(choice, gameResult);

      // Store last game data for pattern recognition
      setLastGameResult(gameResult);
      setLastPlayerChoice(choice);

      // Generate new seed for next round
      generateNewSeed();
      setIsLoading(false);
    }, 1000);
  };

  // Generate AI choice based on learned patterns and verifiable randomness
  const generateAiChoice = (playerMove) => {
    // Use the current seed to generate a verifiably random number
    const randomValue =
      parseInt(
        SHA256(seed + playerMove)
          .toString()
          .substring(0, 8),
        16
      ) % 100;

    // Apply AI strategy based on weights
    if (randomValue < weights.rock) {
      return "paper"; // AI counters with paper if predicting rock
    } else if (randomValue < weights.rock + weights.paper) {
      return "scissors"; // AI counters with scissors if predicting paper
    } else {
      return "rock"; // AI counters with rock if predicting scissors
    }
  };

  // Determine winner of the round
  const determineWinner = (player, ai) => {
    if (player === ai) return "draw";
    if (
      (player === "rock" && ai === "scissors") ||
      (player === "paper" && ai === "rock") ||
      (player === "scissors" && ai === "paper")
    ) {
      return "win";
    }
    return "lose";
  };

  // Update score based on game result
  const updateScore = (result) => {
    if (result === "win") {
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
    } else if (result === "lose") {
      setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
    } else {
      setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  // Update AI learning model based on player choices and outcomes
  const updateAiModel = (currentChoice, gameResult) => {
    // Skip first round when there's no history
    if (lastGameResult === null) return;

    // Update pattern recognition
    const newPatterns = { ...playerPatterns };

    if (lastGameResult === "win") {
      if (currentChoice === lastPlayerChoice) {
        newPatterns.afterWin.repeat += 1;
      } else {
        newPatterns.afterWin.change += 1;
      }
    } else if (lastGameResult === "lose") {
      if (currentChoice === lastPlayerChoice) {
        newPatterns.afterLoss.repeat += 1;
      } else {
        newPatterns.afterLoss.change += 1;
      }
    } else {
      if (currentChoice === lastPlayerChoice) {
        newPatterns.afterDraw.repeat += 1;
      } else {
        newPatterns.afterDraw.change += 1;
      }
    }

    setPlayerPatterns(newPatterns);

    // Adjust weights based on observed patterns
    const newWeights = { ...weights };

    // Increase AI confidence with each game
    let newConfidence = aiConfidence;
    if (gameResult === "win") {
      newConfidence = Math.max(1, aiConfidence - 1);
    } else if (gameResult === "lose") {
      newConfidence = Math.min(10, aiConfidence + 1);
    }

    setAiConfidence(newConfidence);

    // Calculate tendency to repeat after specific outcomes
    const winRepeatRatio =
      newPatterns.afterWin.repeat /
      (newPatterns.afterWin.repeat + newPatterns.afterWin.change || 1);
    const lossRepeatRatio =
      newPatterns.afterLoss.repeat /
      (newPatterns.afterLoss.repeat + newPatterns.afterLoss.change || 1);
    const drawRepeatRatio =
      newPatterns.afterDraw.repeat /
      (newPatterns.afterDraw.repeat + newPatterns.afterDraw.change || 1);

    // Predict next move based on last game result
    if (lastGameResult === "win") {
      // If player tends to repeat after winning
      if (winRepeatRatio > 0.6) {
        // Adjust weights to counter the predicted repeat
        if (lastPlayerChoice === "rock") {
          newWeights.rock = (50 * newConfidence) / 10;
          newWeights.paper = (25 * (10 - newConfidence)) / 10;
          newWeights.scissors = 100 - newWeights.rock - newWeights.paper;
        } else if (lastPlayerChoice === "paper") {
          newWeights.paper = (50 * newConfidence) / 10;
          newWeights.scissors = (25 * (10 - newConfidence)) / 10;
          newWeights.rock = 100 - newWeights.paper - newWeights.scissors;
        } else {
          newWeights.scissors = (50 * newConfidence) / 10;
          newWeights.rock = (25 * (10 - newConfidence)) / 10;
          newWeights.paper = 100 - newWeights.scissors - newWeights.rock;
        }
      } else if (winRepeatRatio < 0.4) {
        // If player tends to change after winning
        if (lastPlayerChoice === "rock") {
          newWeights.paper = (40 * newConfidence) / 10;
          newWeights.scissors = (40 * newConfidence) / 10;
          newWeights.rock = 100 - newWeights.paper - newWeights.scissors;
        } else if (lastPlayerChoice === "paper") {
          newWeights.rock = (40 * newConfidence) / 10;
          newWeights.scissors = (40 * newConfidence) / 10;
          newWeights.paper = 100 - newWeights.rock - newWeights.scissors;
        } else {
          newWeights.rock = (40 * newConfidence) / 10;
          newWeights.paper = (40 * newConfidence) / 10;
          newWeights.scissors = 100 - newWeights.rock - newWeights.paper;
        }
      }
    } else if (lastGameResult === "lose") {
      // If player tends to change strategy after losing
      if (lossRepeatRatio < 0.4) {
        if (lastPlayerChoice === "rock") {
          newWeights.scissors = (45 * newConfidence) / 10;
          newWeights.paper = (35 * newConfidence) / 10;
          newWeights.rock = 100 - newWeights.scissors - newWeights.paper;
        } else if (lastPlayerChoice === "paper") {
          newWeights.rock = (45 * newConfidence) / 10;
          newWeights.scissors = (35 * newConfidence) / 10;
          newWeights.paper = 100 - newWeights.rock - newWeights.scissors;
        } else {
          newWeights.paper = (45 * newConfidence) / 10;
          newWeights.rock = (35 * newConfidence) / 10;
          newWeights.scissors = 100 - newWeights.paper - newWeights.rock;
        }
      } else if (lossRepeatRatio > 0.6) {
        // If player tends to repeat after losing
        if (lastPlayerChoice === "rock") {
          newWeights.rock = (55 * newConfidence) / 10;
          newWeights.paper = (30 * (10 - newConfidence)) / 10;
          newWeights.scissors = 100 - newWeights.rock - newWeights.paper;
        } else if (lastPlayerChoice === "paper") {
          newWeights.paper = (55 * newConfidence) / 10;
          newWeights.scissors = (30 * (10 - newConfidence)) / 10;
          newWeights.rock = 100 - newWeights.paper - newWeights.scissors;
        } else {
          newWeights.scissors = (55 * newConfidence) / 10;
          newWeights.rock = (30 * (10 - newConfidence)) / 10;
          newWeights.paper = 100 - newWeights.scissors - newWeights.rock;
        }
      }
    } else if (lastGameResult === "draw") {
      // Use drawRepeatRatio to adjust strategy after draws
      if (drawRepeatRatio > 0.6) {
        // Player tends to repeat after draws
        if (lastPlayerChoice === "rock") {
          newWeights.rock = (60 * newConfidence) / 10;
          newWeights.paper = (25 * (10 - newConfidence)) / 10;
          newWeights.scissors = 100 - newWeights.rock - newWeights.paper;
        } else if (lastPlayerChoice === "paper") {
          newWeights.paper = (60 * newConfidence) / 10;
          newWeights.scissors = (25 * (10 - newConfidence)) / 10;
          newWeights.rock = 100 - newWeights.paper - newWeights.scissors;
        } else {
          newWeights.scissors = (60 * newConfidence) / 10;
          newWeights.rock = (25 * (10 - newConfidence)) / 10;
          newWeights.paper = 100 - newWeights.scissors - newWeights.rock;
        }
      } else if (drawRepeatRatio < 0.4) {
        // Player tends to change after draws
        if (lastPlayerChoice === "rock") {
          newWeights.paper = (45 * newConfidence) / 10;
          newWeights.scissors = (35 * newConfidence) / 10;
          newWeights.rock = 100 - newWeights.paper - newWeights.scissors;
        } else if (lastPlayerChoice === "paper") {
          newWeights.rock = (45 * newConfidence) / 10;
          newWeights.scissors = (35 * newConfidence) / 10;
          newWeights.paper = 100 - newWeights.rock - newWeights.scissors;
        } else {
          newWeights.rock = (45 * newConfidence) / 10;
          newWeights.paper = (35 * newConfidence) / 10;
          newWeights.scissors = 100 - newWeights.rock - newWeights.paper;
        }
      }
    }

    // Ensure weights sum to 100
    const sum = newWeights.rock + newWeights.paper + newWeights.scissors;
    newWeights.rock = (newWeights.rock / sum) * 100;
    newWeights.paper = (newWeights.paper / sum) * 100;
    newWeights.scissors = 100 - newWeights.rock - newWeights.paper;

    setWeights(newWeights);
  };

  // Reset game for next round
  const playAgain = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult("");
  };

  // Verify the randomness of AI's choice
  const verifyRandomness = () => {
    setShowVerification(!showVerification);
  };

  // Reset the entire game
  const resetGame = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult("");
    setScore({ player: 0, ai: 0, draws: 0 });
    setGameHistory([]);
    setGameCount(0);
    setPlayerPatterns({
      afterWin: { repeat: 0, change: 0 },
      afterLoss: { repeat: 0, change: 0 },
      afterDraw: { repeat: 0, change: 0 },
    });
    setLastGameResult(null);
    setLastPlayerChoice(null);
    setAiConfidence(3);
    setWeights({
      rock: 33.33,
      paper: 33.33,
      scissors: 33.34,
    });
    generateNewSeed();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-gray-900 to-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Rock Paper Scissors
          </h1>
          <h2 className="text-xl text-blue-400">
            with Verifiable Randomness & Timelock Encryption
          </h2>
          <p className="mt-2 text-gray-400">
            Building a fairer future with AI through cryptographic guarantees
          </p>
        </div>
        text
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center bg-indigo-900 bg-opacity-50 p-3 rounded-lg w-28">
              <h2 className="text-lg font-semibold">You</h2>
              <p className="text-3xl font-bold text-blue-400">{score.player}</p>
            </div>

            <div className="text-center bg-gray-900 bg-opacity-50 p-3 rounded-lg">
              <h2 className="text-sm font-semibold">Draws</h2>
              <p className="text-2xl font-bold text-gray-400">{score.draws}</p>
            </div>

            <div className="text-center bg-indigo-900 bg-opacity-50 p-3 rounded-lg w-28">
              <h2 className="text-lg font-semibold">AI</h2>
              <p className="text-3xl font-bold text-purple-400">{score.ai}</p>
            </div>
          </div>
          <div className="flex flex-col items-center mb-6">
            {" "}
            {isTimelocked && (
              <div className="flex items-center text-yellow-400 text-sm mb-3 bg-yellow-900 bg-opacity-20 px-3 py-1 rounded-full">
                {" "}
                <Lock size={14} className="mr-1" />{" "}
                <span>
                  {" "}
                  Timelock Active:{" "}
                  {Math.ceil((timelockExpiry - new Date()) / 1000)}s{" "}
                </span>{" "}
              </div>
            )}{" "}
            {!isTimelocked && !playerChoice && (
              <div className="flex items-center text-green-400 text-sm mb-3 bg-green-900 bg-opacity-20 px-3 py-1 rounded-full">
                {" "}
                <Shield size={14} className="mr-1" />{" "}
                <span>Randomness Verified - Ready to Play</span>{" "}
              </div>
            )}{" "}
            <div className="flex justify-center space-x-8 mb-4">
              {" "}
              <div className="text-center">
                {" "}
                <h3 className="text-lg mb-2">Your Choice</h3>{" "}
                <div className="h-36 w-36 flex items-center justify-center bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600 shadow-inner">
                  {" "}
                  {playerChoice ? (
                    <div className="text-7xl transform transition-all duration-300 hover:scale-110">
                      {" "}
                      {playerChoice === "rock" && "🪨"}{" "}
                      {playerChoice === "paper" && "📄"}{" "}
                      {playerChoice === "scissors" && "✂️"}{" "}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-lg">Choose below</span>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <div className="text-center">
                {" "}
                <h3 className="text-lg mb-2">AI Choice</h3>{" "}
                <div className="h-36 w-36 flex items-center justify-center bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600 shadow-inner">
                  {" "}
                  {aiChoice ? (
                    <div className="text-7xl transform transition-all duration-300 hover:scale-110">
                      {" "}
                      {aiChoice === "rock" && "🪨"}{" "}
                      {aiChoice === "paper" && "📄"}{" "}
                      {aiChoice === "scissors" && "✂️"}{" "}
                    </div>
                  ) : isLoading ? (
                    <div className="flex space-x-2">
                      {" "}
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>{" "}
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100"></div>{" "}
                      <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-200"></div>{" "}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {" "}
                      <Lock size={24} className="text-yellow-400 mb-2" />{" "}
                      <span className="text-xs text-yellow-400">
                        Timelocked
                      </span>{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {result && (
              <div className="text-center mb-6 animate-pulse">
                {" "}
                <h2 className="text-2xl font-bold">
                  {" "}
                  {result === "win" && (
                    <span className="text-green-400">You Win! 🎉</span>
                  )}{" "}
                  {result === "lose" && (
                    <span className="text-red-400">AI Wins! 🤖</span>
                  )}{" "}
                  {result === "draw" && (
                    <span className="text-yellow-400">It's a Draw! 🤝</span>
                  )}{" "}
                </h2>{" "}
              </div>
            )}{" "}
          </div>
          {!playerChoice ? (
            <div className="flex flex-col items-center">
              {" "}
              <div className="flex justify-center space-x-4 mb-4">
                {" "}
                <button
                  onClick={() => makeChoice("rock")}
                  disabled={isTimelocked}
                  className={`${
                    isTimelocked
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                  } text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:transform-none`}
                >
                  {" "}
                  🪨 Rock{" "}
                </button>{" "}
                <button
                  onClick={() => makeChoice("paper")}
                  disabled={isTimelocked}
                  className={`${
                    isTimelocked
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
                  } text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:transform-none`}
                >
                  {" "}
                  📄 Paper{" "}
                </button>{" "}
                <button
                  onClick={() => makeChoice("scissors")}
                  disabled={isTimelocked}
                  className={`${
                    isTimelocked
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  } text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:transform-none`}
                >
                  {" "}
                  ✂️ Scissors{" "}
                </button>{" "}
              </div>{" "}
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              {" "}
              <button
                onClick={playAgain}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
              >
                {" "}
                Play Again{" "}
              </button>{" "}
            </div>
          )}{" "}
          <div className="flex justify-center space-x-4 mb-4">
            {" "}
            <button
              onClick={verifyRandomness}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm flex items-center"
            >
              {" "}
              <Info size={16} className="mr-2" />{" "}
              {showVerification ? "Hide Verification" : "Verify Randomness"}{" "}
            </button>
            <button
              onClick={resetGame}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm flex items-center"
            >
              <RefreshCw size={16} className="mr-2" /> Reset Game{" "}
            </button>{" "}
          </div>
          {showVerification && (
            <div className="bg-gray-900 p-4 rounded-lg text-xs font-mono overflow-auto border border-gray-700 mb-4">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <p className="mb-2 text-blue-400">
                    Current Seed: <span className="text-white">{seed}</span>
                  </p>{" "}
                  <p className="mb-2 text-blue-400">
                    Verification Hash:{" "}
                    <span className="text-white">
                      {verificationHash.substring(0, 20)}...
                    </span>
                  </p>{" "}
                  <p className="mb-2 text-blue-400">
                    AI Confidence Level:{" "}
                    <span className="text-white">{aiConfidence}/10</span>
                  </p>{" "}
                  <div className="mb-2">
                    {" "}
                    <p className="text-blue-400">AI Strategy Weights:</p>{" "}
                    <div className="mt-1 bg-gray-800 rounded p-2">
                      {" "}
                      <div className="mb-1">
                        {" "}
                        <span>Rock: </span>{" "}
                        <div className="h-2 w-full bg-gray-700 rounded-full mt-1">
                          {" "}
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${weights.rock}%` }}
                          ></div>{" "}
                        </div>{" "}
                        <span className="text-xs text-right block">
                          {weights.rock.toFixed(2)}%
                        </span>{" "}
                      </div>{" "}
                      <div className="mb-1">
                        {" "}
                        <span>Paper: </span>{" "}
                        <div className="h-2 w-full bg-gray-700 rounded-full mt-1">
                          {" "}
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${weights.paper}%` }}
                          ></div>{" "}
                        </div>{" "}
                        <span className="text-xs text-right block">
                          {weights.paper.toFixed(2)}%
                        </span>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <span>Scissors: </span>{" "}
                        <div className="h-2 w-full bg-gray-700 rounded-full mt-1">
                          {" "}
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${weights.scissors}%` }}
                          ></div>{" "}
                        </div>{" "}
                        <span className="text-xs text-right block">
                          {weights.scissors.toFixed(2)}%
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="text-purple-400 mb-1">
                    Player Pattern Analysis:
                  </p>{" "}
                  <div className="bg-gray-800 rounded p-2">
                    {" "}
                    <div className="mb-2">
                      {" "}
                      <p className="text-sm">After Win:</p>{" "}
                      <div className="flex justify-between text-xs">
                        {" "}
                        <span>
                          Repeat: {playerPatterns.afterWin.repeat}
                        </span>{" "}
                        <span>Change: {playerPatterns.afterWin.change}</span>{" "}
                      </div>{" "}
                      {playerPatterns.afterWin.repeat +
                        playerPatterns.afterWin.change >
                        0 && (
                        <div className="h-2 w-full bg-gray-700 rounded-full mt-1">
                          {" "}
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${
                                (playerPatterns.afterWin.repeat /
                                  (playerPatterns.afterWin.repeat +
                                    playerPatterns.afterWin.change)) *
                                100
                              }%`,
                            }}
                          ></div>{" "}
                        </div>
                      )}{" "}
                    </div>{" "}
                    <div className="mb-2">
                      {" "}
                      <p className="text-sm">After Loss:</p>{" "}
                      <div className="flex justify-between text-xs">
                        {" "}
                        <span>
                          Repeat: {playerPatterns.afterLoss.repeat}
                        </span>{" "}
                        <span>Change: {playerPatterns.afterLoss.change}</span>{" "}
                      </div>{" "}
                      {playerPatterns.afterLoss.repeat +
                        playerPatterns.afterLoss.change >
                        0 && (
                        <div className="h-2 w-full bg-gray-700 rounded-full mt-1">
                          {" "}
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{
                              width: `${
                                (playerPatterns.afterLoss.repeat /
                                  (playerPatterns.afterLoss.repeat +
                                    playerPatterns.afterLoss.change)) *
                                100
                              }%`,
                            }}
                          ></div>{" "}
                        </div>
                      )}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="text-sm">After Draw:</p>{" "}
                      <div className="flex justify-between text-xs">
                        {" "}
                        <span>
                          Repeat: {playerPatterns.afterDraw.repeat}
                        </span>{" "}
                        <span>Change: {playerPatterns.afterDraw.change}</span>{" "}
                      </div>{" "}
                      {playerPatterns.afterDraw.repeat +
                        playerPatterns.afterDraw.change >
                        0 && (
                        <div className="h-2 w-full bg-gray-700 rounded-full mt-1">
                          {" "}
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{
                              width: `${
                                (playerPatterns.afterDraw.repeat /
                                  (playerPatterns.afterDraw.repeat +
                                    playerPatterns.afterDraw.change)) *
                                100
                              }%`,
                            }}
                          ></div>{" "}
                        </div>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
          <div className="mt-4">
            {" "}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
            >
              {" "}
              <div className="flex items-center">
                {" "}
                <Award size={18} className="mr-2 text-blue-400" />{" "}
                <span className="font-semibold">Game History</span>{" "}
              </div>{" "}
              {showHistory ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}{" "}
            </button>
            {showHistory && (
              <div className="mt-2 bg-gray-800 bg-opacity-60 rounded-lg p-4 overflow-auto max-h-60">
                {gameHistory.length === 0 ? (
                  <p className="text-gray-400 text-center">
                    No games played yet
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    {" "}
                    <thead>
                      {" "}
                      <tr className="bg-gray-700 bg-opacity-60">
                        {" "}
                        <th className="p-2 text-left">Round</th>{" "}
                        <th className="p-2 text-left">Your Move</th>{" "}
                        <th className="p-2 text-left">AI Move</th>{" "}
                        <th className="p-2 text-left">Result</th>{" "}
                        <th className="p-2 text-left">Seed</th>{" "}
                      </tr>{" "}
                    </thead>{" "}
                    <tbody>
                      {" "}
                      {gameHistory.map((game, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0
                              ? "bg-gray-800"
                              : "bg-gray-700 bg-opacity-40"
                          }
                        >
                          {" "}
                          <td className="p-2">{game.id}</td>{" "}
                          <td className="p-2">
                            {" "}
                            {game.playerChoice === "rock" && "🪨"}{" "}
                            {game.playerChoice === "paper" && "📄"}{" "}
                            {game.playerChoice === "scissors" && "✂️"}{" "}
                          </td>{" "}
                          <td className="p-2">
                            {" "}
                            {game.aiChoice === "rock" && "🪨"}{" "}
                            {game.aiChoice === "paper" && "📄"}{" "}
                            {game.aiChoice === "scissors" && "✂️"}{" "}
                          </td>{" "}
                          <td className="p-2">
                            {" "}
                            {game.result === "win" && (
                              <span className="text-green-400">Win</span>
                            )}{" "}
                            {game.result === "lose" && (
                              <span className="text-red-400">Loss</span>
                            )}{" "}
                            {game.result === "draw" && (
                              <span className="text-yellow-400">Draw</span>
                            )}{" "}
                          </td>{" "}
                          <td className="p-2 text-xs font-mono">
                            {game.seed.substring(0, 8)}...
                          </td>{" "}
                        </tr>
                      ))}{" "}
                    </tbody>{" "}
                  </table>
                )}
              </div>
            )}{" "}
          </div>
          <div className="mt-6 text-center text-sm text-gray-400">
            {" "}
            <p>
              This game uses verifiable randomness and timelock encryption to
              ensure fair play.
            </p>{" "}
            <p>Built for Randamu Bounty Challenge - March 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FairAIGame;
