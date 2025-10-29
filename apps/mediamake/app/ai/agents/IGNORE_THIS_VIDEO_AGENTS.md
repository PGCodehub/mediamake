creating a video by AI is divided into 3 steps,
each steps complexity is based on the video type, the idea, etc..

I wille xplains the steps, based on the simplest video agent.
an agent that can create a short form quote video based on an abstract input video.

There is no clear guideline that it has to split into theese 3 steps,
different cases require different measures, sometimes it makes sense to
merge all 3 steps into a single agent.

step 1. CREATE - script/asset creation
this step might/might not take input depending on criteria.
explained with my example, this step analyses, the video, analyses the user request, creates a quote, the style of the quote etc., it outputs a JSON contianing all the data

in cases where script is generated outside the agent, this step generally involves a simple json or metadata generation i guess..

step2. PROCESSS - preprocess the script + output of step 1.
this step takes the generated quote, and processes it,
a different style of end video would require different processings.
explained with my example, it needs to read the quote, and video anlysis,
and pick the right musical track ( if user did not already provide ), as well as split the quote into lines/scenes to present.

TODO (to make the shorts agent):

- music library (analysis & other params) to pick from ( sparkboard rag base with tag alignment ) - in media directly
- music i need the best parts detected ( or preset by user )
- a split quote preset (intakes 2 lines, 1 video url, style, )

We are not defined by the depths from which we came,
but by the light we choose to swim towards

music style = ?? wildwest, phonk, cello, epic, melody,
font style = ??
quote render = "inparts", "allatonce", ""
store the thumbnail for procesisng.
top, middle, bottom, fullscale, textcrop

rag search playground.

TODO

- media metadata analysis
- midjourney prompts maker agents.
- agent calssification in sidebar.
