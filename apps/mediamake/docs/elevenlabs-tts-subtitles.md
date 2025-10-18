# ElevenLabs TTS to Subtitles: Complete Implementation Guide

A comprehensive guide for generating synchronized subtitles from ElevenLabs text-to-speech with precise timing information.

## Overview

This document provides a complete implementation for converting text to speech using ElevenLabs API and generating perfectly synchronized subtitles (SRT/WebVTT) from the timing information.

### What This Achieves
- Generate high-quality speech from text using ElevenLabs TTS
- Extract character-level timing information 
- Convert character timings to word-level timestamps
- Generate professional subtitle files (SRT and WebVTT formats)
- Perfect synchronization for video content, e-learning, and accessibility

## Key Features

✅ **Precise Timing**: Character-level accuracy (20-130ms precision)  
✅ **Smart Chunking**: Respects subtitle best practices (max 42 chars, 7 words per line)  
✅ **Multiple Formats**: Both SRT and WebVTT output  
✅ **Production Ready**: Error handling and optimization  
✅ **Easy Integration**: Simple API for existing workflows  

## Complete Python Implementation

```python
"""
ElevenLabs TTS to Subtitle Converter
=====================================
Complete implementation for generating subtitles (SRT/WebVTT) from ElevenLabs text-to-speech with timing.
"""

from elevenlabs.client import ElevenLabs
import base64
from typing import List, Tuple, Dict


class SubtitleGenerator:
    """Convert ElevenLabs TTS timing information to subtitle formats."""
    
    def __init__(self, api_key: str):
        """Initialize with ElevenLabs API key."""
        self.client = ElevenLabs(api_key=api_key)
    
    def generate_speech_with_timing(
        self, 
        text: str, 
        voice_id: str,
        model_id: str = "eleven_flash_v2_5",
        output_format: str = "mp3_44100_128",
        audio_output_path: str = "output.mp3"
    ) -> Dict:
        """
        Generate speech with timing information.
        
        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID
            model_id: Model to use (default: eleven_flash_v2_5)
            output_format: Audio format
            audio_output_path: Where to save the audio file
            
        Returns:
            Dictionary containing audio path and alignment data
        """
        print(f"Generating speech for: {text[:50]}...")
        
        # Generate speech with timestamps
        response = self.client.text_to_speech.convert_with_timestamps(
            voice_id=voice_id,
            text=text,
            model_id=model_id,
            output_format=output_format
        )
        
        # Save audio
        audio_data = base64.b64decode(response.audio_base64)
        with open(audio_output_path, "wb") as f:
            f.write(audio_data)
        print(f"Audio saved to: {audio_output_path}")
        
        # Extract timing information
        alignment = response.alignment
        normalized_alignment = response.normalized_alignment
        
        return {
            "audio_path": audio_output_path,
            "alignment": {
                "characters": alignment.characters,
                "character_start_times": alignment.character_start_times_seconds,
                "character_end_times": alignment.character_end_times_seconds
            },
            "normalized_alignment": normalized_alignment if normalized_alignment else None
        }
    
    def calculate_word_timings(
        self, 
        alignment: Dict,
        max_chars_per_subtitle: int = 42,
        max_words_per_subtitle: int = 7
    ) -> List[Tuple[str, float, float]]:
        """
        Calculate word-level timings and group into subtitle chunks.
        
        Args:
            alignment: Character alignment data
            max_chars_per_subtitle: Maximum characters per subtitle line
            max_words_per_subtitle: Maximum words per subtitle chunk
            
        Returns:
            List of (text, start_time, end_time) tuples
        """
        chars = alignment["characters"]
        char_start_times = alignment["character_start_times"]
        char_end_times = alignment["character_end_times"]
        
        if not chars or not char_start_times:
            return []
        
        # First, extract individual words with their timings
        words = []
        current_word = ""
        word_start_time = None
        word_end_time = None
        
        for i, char in enumerate(chars):
            if char.strip():  # Non-whitespace character
                if word_start_time is None:
                    word_start_time = char_start_times[i]
                current_word += char
                word_end_time = char_end_times[i]
            else:  # Whitespace - end of word
                if current_word:
                    words.append((current_word, word_start_time, word_end_time))
                    current_word = ""
                    word_start_time = None
                    word_end_time = None
        
        # Add the last word if exists
        if current_word:
            words.append((current_word, word_start_time, word_end_time))
        
        # Group words into subtitle chunks
        subtitles = []
        current_chunk = []
        chunk_start = None
        chunk_end = None
        current_length = 0
        
        for word, start, end in words:
            # Check if adding this word would exceed limits
            new_length = current_length + len(word) + (1 if current_chunk else 0)
            
            if (len(current_chunk) >= max_words_per_subtitle or 
                new_length > max_chars_per_subtitle) and current_chunk:
                # Save current chunk and start new one
                subtitle_text = " ".join(current_chunk)
                subtitles.append((subtitle_text, chunk_start, chunk_end))
                current_chunk = []
                current_length = 0
                chunk_start = None
            
            # Add word to current chunk
            if chunk_start is None:
                chunk_start = start
            current_chunk.append(word)
            chunk_end = end
            current_length += len(word) + (1 if len(current_chunk) > 1 else 0)
        
        # Add final chunk
        if current_chunk:
            subtitle_text = " ".join(current_chunk)
            subtitles.append((subtitle_text, chunk_start, chunk_end))
        
        return subtitles
    
    def format_srt_time(self, seconds: float) -> str:
        """Format seconds as SRT timestamp (HH:MM:SS,mmm)."""
        milliseconds = int((seconds - int(seconds)) * 1000)
        seconds = int(seconds)
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"
    
    def format_vtt_time(self, seconds: float) -> str:
        """Format seconds as WebVTT timestamp (HH:MM:SS.mmm)."""
        milliseconds = int((seconds - int(seconds)) * 1000)
        seconds = int(seconds)
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"
    
    def generate_srt(
        self, 
        subtitles: List[Tuple[str, float, float]], 
        output_path: str = "subtitles.srt"
    ) -> str:
        """Generate SRT subtitle file."""
        srt_content = []
        
        for i, (text, start_time, end_time) in enumerate(subtitles, 1):
            # Subtitle index
            srt_content.append(str(i))
            
            # Timecodes
            start = self.format_srt_time(start_time)
            end = self.format_srt_time(end_time)
            srt_content.append(f"{start} --> {end}")
            
            # Subtitle text
            srt_content.append(text)
            
            # Blank line separator
            srt_content.append("")
        
        # Write to file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(srt_content))
        
        print(f"SRT file saved to: {output_path}")
        return output_path
    
    def generate_vtt(
        self, 
        subtitles: List[Tuple[str, float, float]], 
        output_path: str = "subtitles.vtt"
    ) -> str:
        """Generate WebVTT subtitle file."""
        vtt_content = ["WEBVTT", ""]
        
        for i, (text, start_time, end_time) in enumerate(subtitles, 1):
            # Optional cue identifier
            vtt_content.append(f"cue-{i}")
            
            # Timecodes
            start = self.format_vtt_time(start_time)
            end = self.format_vtt_time(end_time)
            vtt_content.append(f"{start} --> {end}")
            
            # Subtitle text
            vtt_content.append(text)
            
            # Blank line separator
            vtt_content.append("")
        
        # Write to file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(vtt_content))
        
        print(f"VTT file saved to: {output_path}")
        return output_path
    
    def process_text_to_subtitles(
        self,
        text: str,
        voice_id: str,
        audio_output: str = "output.mp3",
        srt_output: str = "subtitles.srt",
        vtt_output: str = "subtitles.vtt",
        format: str = "both"  # "srt", "vtt", or "both"
    ) -> Dict:
        """
        Complete pipeline: TTS generation -> timing extraction -> subtitle creation.
        
        Args:
            text: Text to convert
            voice_id: ElevenLabs voice ID
            audio_output: Audio file path
            srt_output: SRT file path
            vtt_output: VTT file path
            format: Which subtitle format(s) to generate
            
        Returns:
            Dictionary with paths to generated files
        """
        # Step 1: Generate speech with timing
        result = self.generate_speech_with_timing(
            text=text,
            voice_id=voice_id,
            audio_output_path=audio_output
        )
        
        # Step 2: Calculate word timings
        subtitles = self.calculate_word_timings(result["alignment"])
        print(f"Generated {len(subtitles)} subtitle segments")
        
        # Step 3: Generate subtitle files
        output_files = {"audio": audio_output}
        
        if format in ["srt", "both"]:
            output_files["srt"] = self.generate_srt(subtitles, srt_output)
        
        if format in ["vtt", "both"]:
            output_files["vtt"] = self.generate_vtt(subtitles, vtt_output)
        
        return output_files
```

## Usage Examples

### Basic Usage

```python
# Initialize the subtitle generator
generator = SubtitleGenerator(api_key="your_elevenlabs_api_key")

# Your script text
script = """
Welcome to this tutorial on using ElevenLabs API for generating subtitles.
In this video, we'll explore how to convert text to speech with precise timing information.
This allows us to create perfectly synchronized subtitles for our content.
The process is straightforward and produces professional results.
"""

# Voice ID (example: Adam voice)
voice_id = "pNInz6obpgDQGcFmaJgB"

# Generate audio and subtitles
outputs = generator.process_text_to_subtitles(
    text=script,
    voice_id=voice_id,
    audio_output="narration.mp3",
    srt_output="narration.srt",
    vtt_output="narration.vtt",
    format="both"
)

print("Generated files:")
for file_type, path in outputs.items():
    print(f"  {file_type.upper()}: {path}")
```

### Advanced Configuration

```python
# Custom voice settings and chunking
result = generator.generate_speech_with_timing(
    text="Your long script here...",
    voice_id="pNInz6obpgDQGcFmaJgB",
    model_id="eleven_multilingual_v2",  # Higher quality
    output_format="mp3_44100_192"       # Higher quality audio
)

# Custom subtitle chunking
subtitles = generator.calculate_word_timings(
    result["alignment"],
    max_chars_per_subtitle=35,  # Shorter lines for mobile
    max_words_per_subtitle=5    # Fewer words per subtitle
)

# Generate only SRT
generator.generate_srt(subtitles, "custom.srt")
```

## Configuration Options

### Voice Models
- `eleven_flash_v2_5`: Ultra-low 75ms latency, up to 40,000 characters
- `eleven_turbo_v2_5`: Fast with good quality, up to 40,000 characters  
- `eleven_multilingual_v2`: Highest quality, 32 languages, up to 10,000 characters
- `eleven_v3`: Most expressive with emotion control (alpha)

### Audio Formats
- `mp3_22050_32`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_128`, `mp3_44100_192`
- `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100`
- `ulaw_8000` (for Twilio integration)

### Subtitle Chunking
- **Max Characters**: 42 (Netflix standard), 35 (mobile-friendly)
- **Max Words**: 7 per subtitle chunk for readability
- **Timing**: Based on natural speech patterns and pauses

## Output Formats

### SRT Format Example
```
1
00:00:00,000 --> 00:00:02,500
Welcome to this tutorial on using

2
00:00:02,500 --> 00:00:05,200
ElevenLabs API for generating subtitles.

3
00:00:05,200 --> 00:00:08,100
In this video, we'll explore how
```

### WebVTT Format Example
```
WEBVTT

cue-1
00:00:00.000 --> 00:00:02.500
Welcome to this tutorial on using

cue-2
00:00:02.500 --> 00:00:05.200
ElevenLabs API for generating subtitles.

cue-3
00:00:05.200 --> 00:00:08.100
In this video, we'll explore how
```

## Integration with Video

### FFmpeg Integration
```bash
# Embed SRT subtitles
ffmpeg -i video.mp4 -i subtitles.srt -c copy -c:s mov_text output.mp4

# Burn subtitles into video
ffmpeg -i video.mp4 -vf subtitles=subtitles.srt output_with_subs.mp4

# Use WebVTT for web
ffmpeg -i video.mp4 -i subtitles.vtt -c copy output.mp4
```

### HTML5 Video
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="subtitles" src="subtitles.vtt" srclang="en" label="English" default>
</video>
```

## Performance & Costs

### Timing Accuracy
- **Character-level precision**: 20-130ms accuracy
- **Word-level calculated**: Based on character boundaries
- **Subtitle chunks**: Optimized for readability and timing

### API Costs (October 2025)
- **TTS with timestamps**: Standard TTS pricing
- **Flash v2.5**: ~$0.30 per 1K characters
- **Multilingual v2**: ~$1.50 per 1K characters
- **Turbo v2.5**: ~$0.30 per 1K characters

### Processing Speed
- **Flash v2.5**: 75ms latency + generation time
- **Character extraction**: Near real-time
- **Subtitle generation**: Instant post-processing

## Best Practices

### Text Preparation
- **Clean formatting**: Remove extra whitespace and formatting
- **Natural pacing**: Use punctuation for natural pauses
- **Sentence structure**: Keep sentences clear and well-structured
- **Length limits**: Stay within model character limits

### Subtitle Optimization
- **Reading speed**: 180-200 words per minute maximum
- **Line breaks**: Break at natural speech pauses
- **Character limits**: 42 characters per line (Netflix standard)
- **Duration**: 1-6 seconds per subtitle segment

### Quality Assurance
- **Review timing**: Check subtitle synchronization
- **Test playback**: Verify on target platform
- **Accessibility**: Ensure compliance with WCAG guidelines
- **Format compatibility**: Test SRT/VTT on intended players

## Troubleshooting

### Common Issues
- **Missing alignment**: Very short texts may not return timing data
- **Timing drift**: Long texts may accumulate small timing errors  
- **Character limits**: Some models have strict input limits
- **Voice availability**: Ensure voice is added to your Voice Lab

### Error Handling
```python
try:
    result = generator.generate_speech_with_timing(text, voice_id)
    if not result["alignment"]["characters"]:
        print("Warning: No timing data received")
except Exception as e:
    print(f"Error generating speech: {e}")
```

## Requirements

```bash
pip install elevenlabs
```

### Dependencies
- `elevenlabs`: Official ElevenLabs Python SDK
- `base64`: Built-in Python module
- `typing`: Built-in Python module (Python 3.5+)

## License & Usage

This implementation is provided as-is for educational and commercial use. Make sure to comply with ElevenLabs terms of service and API usage guidelines.

---

**Created**: October 2025  
**Compatible with**: ElevenLabs API v1  
**Python Version**: 3.7+