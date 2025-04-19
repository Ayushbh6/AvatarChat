// webSpeechAPI.js - handles audio recording and transcription via OpenAI gpt-4o-transcribe

document.addEventListener('DOMContentLoaded', () => {
  const recordButton = document.getElementById('speechButton');
  const cancelButton = document.getElementById('cancelSpeechButton');
  const textArea = document.getElementById('textArea');
  const chatButton = document.getElementById('chatButton');
  const speakButton = document.getElementById('speakButton');
  const voiceVisualization = document.getElementById('voiceVisualization');
  const voiceBars = document.querySelectorAll('.voice-bar');

  let mediaRecorder = null;
  let audioChunks = [];
  let stream = null;
  let isRecording = false;
  let audioContext = null;
  let analyser = null;
  let animationFrameId = null;

  // Add debug logging
  console.log('Voice visualization element:', voiceVisualization);
  console.log('Voice bars:', voiceBars);

  recordButton.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  cancelButton.addEventListener('click', () => {
    if (isRecording) {
      cancelRecording();
    }
  });

  async function startRecording() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      // Set up audio analysis with higher resolution for better visualization
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Further increased for better frequency resolution
      analyser.smoothingTimeConstant = 0.4; // Slightly reduced smoothing for more responsive visualization
      analyser.minDecibels = -90; // Increase sensitivity to quiet sounds
      analyser.maxDecibels = -10; // Ensure loud sounds don't overwhelm the visualization
      source.connect(analyser);

      mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) audioChunks.push(event.data);
      });

      // Store the stop handler so we can remove it later if needed
      const stopHandler = onRecordingStop;
      mediaRecorder.addEventListener('stop', stopHandler);
      
      // Store the handler reference for removal during cancel
      mediaRecorder.stopHandler = stopHandler;

      // Start recording and visualization
      mediaRecorder.start();
      isRecording = true;
      updateUI(true);
      visualize();
      
      console.log('Recording started - Visualization state:', {
        display: voiceVisualization.style.display,
        classList: Array.from(voiceVisualization.classList),
        isVisible: window.getComputedStyle(voiceVisualization).display !== 'none'
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to access microphone. Please ensure microphone permissions are granted.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      stopVisualization();
    }
  }

  function cancelRecording() {
    console.log('Canceling recording...');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Remove the stop event listener to prevent processing
      if (mediaRecorder.stopHandler) {
        mediaRecorder.removeEventListener('stop', mediaRecorder.stopHandler);
      }
      mediaRecorder.stop();
      
      // Clear recorded audio
      audioChunks = [];
      
      // Stop visualization and cleanup
      stopVisualization();
      isRecording = false;
      updateUI(false);
      
      console.log('Recording canceled and cleared');
    }
  }

  function stopVisualization() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    voiceBars.forEach(bar => {
      bar.classList.remove('speaking');
      bar.style.transform = 'scaleY(0.2)';
    });
  }

  function visualize() {
    if (!analyser || !isRecording) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate audio level (simple average of frequencies)
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    
    // Update visualization bars with individual transforms based on frequency bands
    voiceBars.forEach((bar, index) => {
      // Get a slice of the frequency data for this bar
      const segmentSize = Math.floor(dataArray.length / voiceBars.length);
      const start = index * segmentSize;
      const end = start + segmentSize;
      const segment = dataArray.slice(start, end);
      
      // Calculate scale based on the average of this frequency segment
      const segmentAvg = segment.reduce((acc, val) => acc + val, 0) / segment.length;
      
      // Apply amplification to make visualization more sensitive
      // Use non-linear scale (power of 0.6) to enhance low values more than high values
      const enhancedScale = Math.pow(segmentAvg / 128, 0.6);
      
      // Amplify the scale by 1.8x for more dynamic visual effect
      // This will make the bars move more with normal speaking volume
      const amplifiedScale = Math.max(0.2, Math.min(1, enhancedScale * 1.8));
      
      // Apply dynamic scaling based on actual audio levels
      bar.style.transform = `scaleY(${amplifiedScale})`;
      
      // Lower the threshold to make it more responsive to normal speech
      if (segmentAvg > 5) { // Reduced from 10 to 5 for increased sensitivity
        bar.classList.add('speaking');
        // Remove the animation so we can control height manually
        bar.style.animation = 'none';
      } else {
        bar.classList.remove('speaking');
        bar.style.transform = `scaleY(0.2)`;
      }
    });

    animationFrameId = requestAnimationFrame(visualize);
  }

  async function onRecordingStop() {
    console.log('Processing recording...');
    isRecording = false;
    updateUI(false);
    stopVisualization();

    if (audioChunks.length === 0) {
      console.log('No audio data to process');
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('model', 'gpt-4o-transcribe');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('Transcription request failed:', response.statusText);
        alert('Failed to transcribe audio. Please try again.');
        return;
      }

      const data = await response.json();
      const transcription = data.text || data.transcription || '';
      
      if (transcription.trim()) {
        textArea.value = transcription;
        document.querySelector('#speakButton').click();
      }
    } catch (err) {
      console.error('Transcription error:', err);
      alert('Failed to process audio. Please try again.');
    }
  }

  function updateUI(recording) {
    if (recording) {
      recordButton.style.color = 'red';
      recordButton.querySelector('.material-symbols-outlined').textContent = 'stop';
      chatButton.setAttribute('disabled', true);
      speakButton.setAttribute('disabled', true);
      
      // Show visualization
      voiceVisualization.style.removeProperty('display');
      voiceVisualization.classList.add('active');
      
      // Initialize bars at minimum height
      voiceBars.forEach(bar => {
        bar.classList.add('speaking');
        bar.style.transform = 'scaleY(0.2)';
      });
    } else {
      recordButton.style.color = '';
      recordButton.querySelector('.material-symbols-outlined').textContent = 'mic';
      chatButton.removeAttribute('disabled');
      speakButton.removeAttribute('disabled');
      
      // Hide visualization
      voiceVisualization.classList.remove('active');
      voiceVisualization.style.display = 'none';
      
      // Stop animation on all bars
      voiceBars.forEach(bar => {
        bar.classList.remove('speaking');
      });
    }
  }
});
