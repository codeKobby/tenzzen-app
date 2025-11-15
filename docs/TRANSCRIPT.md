Intro
0:00
[MUSIC PLAYING]
0:03
0:05
SITA SANGAMESWARAN: If you build multi-agents,
0:07
you know how complex they are.
0:09
Today, let's simplify that using Z Agent Development
0:12
Kit, an open-source framework to build AI agents.
0:16
We'll not only build and run our agent,
0:19
but we'll also see how to spin up a client UI to debug
0:22
our agent within a few minutes.
0:25
Let's go.
What is ADK?
0:26
Agent Development Kit-- or ADK, for short--
0:29
lets you not only build and run your agent,
0:32
but also evaluate and deploy seamlessly
0:35
to any provider of your choice.
0:38
And this is powered by code-first flexibility,
0:42
meaning--
0:42
you know there are two ways to build agents.
0:45
One is the config-based.
0:46
Another one is a code-based.
0:48
And inherently, code-based provides you
0:51
with more granular and finer control over your agents
0:54
because it lets you orchestrate them using the coding
0:58
or programming language constructs,
1:00
and ADK was built with this in mind.
1:04
So it is naturally powered by the best
1:07
practices of Pythonic language.
1:09
Think of classes and functions.
1:11
The idea was to make building AI agents as simple as just
1:16
software development.
Sample agent architecture
1:17
And now, let's briefly discuss the architecture before actually
1:21
diving into the code.
1:22
And today, we're going to be building a YouTube Short agent.
1:26
This YouTube Short agent has three sub-agents internally.
1:30
The first one is a ScriptWriter agent,
1:33
which writes scripts given an idea,
1:36
and the second one is your Visualizer agent,
1:39
which actually takes the scripts written
1:41
and creates visuals for it, meaning
1:44
it creates detailed descriptions of what the visuals should look
1:47
like that match the script.
1:49
And we have a third agent, which is the Formatter agent, which
1:53
takes both the script and the slides
1:56
and combines them in a nice, little markdown format,
1:59
just to make it pretty.
2:01
And if you see, the first agent, the first sub-agent,
2:05
actually uses a Google Search tool,
2:07
and this tool comes packaged right with the SDK, meaning it's
2:13
built in and you don't need to write any extra code.
2:17
And we use the Google Search agent here
2:19
because that would provide the ScriptWriter the ability
2:22
to maybe search current trends that's going on
2:25
and create your script outline according to it.
LLM Agent
2:28
[MUSIC PLAYING]
2:31
2:33
And now, let's dive into the code.
2:35
Let's grab the google-adk package from the PyPI
2:38
and jump into our development environment.
2:41
And what we have here is the agent.py file,
2:44
which contains all of the definitions for a root
2:47
agent and the sub-agents.
2:50
Let's start with the root agent.
2:52
Here we have a YouTube Shorts agent, which
2:55
takes in a name and the model.
2:57
And we're using Gemini 2.5 Pro here,
2:59
but you're free to use any model of your choice.
3:03
And that is one of the key capabilities of ADK itself.
3:06
It is model agnostic, deployment agnostic, and interoperable.
3:11
You can bring in any models from anywhere.
3:13
You can deploy your agent to any cloud or any provider
3:16
that you can use.
3:18
And it is also interoperable, meaning
3:21
you can bring your agents that you've
3:23
built using other frameworks into ADK
3:26
and it's all going to work together.
3:29
And coming back to the definition,
3:31
you also see this description and an instruction that's
3:34
being passed to our root agent.
3:36
So the description, maybe you can think of it
3:39
as a one-liner of what an agent is,
3:42
even though it's more than one line in most cases.
3:45
It's helpful to think of, it describes what the agent is.
3:49
And we have an instruction which actually tells--
3:53
which goes over details of step-by-step instruction
3:56
to our agent on how it should accomplish a specific goal.
4:00
And then we see three sub-agents here,
4:03
like we've seen in the architecture diagram before.
4:06
Now let's briefly go over our sub-agents.
4:09
The first one, ScriptWriter, takes in most of the parameters
4:14
that our parent agent actually had.
4:17
And a few key differences are-- we now
4:20
pass in the tool, which is a built in Google Search tool
4:23
here, and then we have a variable called output_key.
4:28
And this is an interesting concept.
4:30
So if you want to pass a state between agents,
4:34
or if you want to pass information between one agent
4:37
to another agent, you can do that via output_key.
4:41
Now, here, output_key is assigned
4:43
to a placeholder variable called a generated_script.
4:45
Now, what will happen is, when this sub-agent runs,
4:49
the response from the LLM that you
4:51
get will be stored into the key called generated_script,
4:54
and every other sub-agent can now access the state
4:59
and retrieve this particular key, generated_script,
5:02
to get the LLM's response.
5:06
And you also see that the instruction here
5:08
is being loaded from a file, and we've actually
5:10
loaded all of the instructions for our agents from a file.
5:14
So if we switch over to one of the instructions,
5:16
it's going to look like this.
5:17
It's going to detail, step by step,
5:19
on how an agent can accomplish this goal.
5:23
Now, if you go to the Visualizer agent and the Formatter agent,
5:27
the definition of it is going to stay the same, more or less,
5:31
except for the instruction.
5:32
Now, if we look at the instruction for the Visualizer,
5:37
this will now call the state of generated_script, which,
5:41
if you remember, is what we put into the output_key
5:44
in the ScriptWriter agent.
5:46
And when we switch over to the format region,
5:50
you will see that it takes in both the state
5:53
of the script and the visual_concepts
5:57
to create the final markdown.
5:59
Now, before we run this agent, let's expose this agent
6:02
in Python's init file by saying a simple line, "from .
6:06
import agent."
6:09
And you see that we're calling Gemini 2.5 Pro model here.
6:14
And in order to authenticate to this model,
6:17
we have to set environment variables, which
6:20
could be an API key.
6:21
And depending upon the model you're using, this could vary.
6:26
Now, I've set my environment variables,
6:28
and it's time to run our agent.
Different ways to run the ADK Agent
6:31
You can run your agent in four different ways.
6:33
The first one is the adk run, which is the CLI command,
6:37
and it directly runs your agent in the command line.
6:40
The second one is adk web, which spins up a brand new Angular UI
6:46
for you to interact with your agent.
6:48
And this also has multimodal capabilities
6:52
where you can interact with the agent using voice or video.
6:56
And the third one is the adk api-server,
6:59
which actually exposes your agent as a REST endpoint.
7:03
And the fourth one is a programmatic way
7:05
to call your agent.
7:07
We'll briefly discuss most of these options in this video.
7:10
And to start with, we're going to use the adk run.
ADK run
7:14
7:18
Let's call the adk run with our agent name,
7:22
and this is going to spin up the agent.
7:25
And now I'm going to type in a prompt saying,
7:29
write me a script on how to build AI agents.
7:34
7:42
And now, if you see, we get a response from our ScriptWriter.
7:46
OK.
7:46
Let's see how the ADK web experience looks like.
ADK web
7:51
I'm going to type adk web to spin up a client UI for us.
7:57
Let's copy-paste the local URL in a new browser tab.
8:01
And now we can see our agent listed here.
8:05
Let's ask it to write a script.
8:08
Now, write me a short script on how to build AI agents.
8:16
8:20
Now, in the UI, you should see all
8:23
of the events that happens within the agent and all
8:27
of the transfers that happens as well.
8:29
So if you see, the first event is handled by our YouTube Shorts
8:33
agent, which is a parent agent, and then it
8:36
has transferred to another agent, which
8:39
is our ScriptWriter agent.
8:41
And this response is from the ScriptWriter agent.
8:44
But if you see, in both these responses,
8:47
using the adk run and the adk web,
8:50
only the ScriptWriter responded, even
8:53
though we had other subagents, like the visualizer
8:55
and the formatter.
8:57
And this is where, inherently, the problem of multi-agent
9:01
surfaces-- in that the parent agent has the LLM capability,
9:06
which it can use and reason to pick and choose
9:09
which subagents should solve a particular user prompt.
9:13
Now, in this case, our parent agent
9:15
decided that ScriptWriter was more than enough to handle
9:18
a user query, and so it didn't pass it to any other agent.
9:22
But what we can do is we can use ADK's capability
9:26
to convert this into a workflow agent
9:29
so we can make sure all of our subagents are run.
Different types of Agents
9:33
So Agent Development Kit has three different types of agents.
9:37
The first one is the LLM agent, where
9:39
you have the traditional definition of,
9:41
an agent is something that has an LLM and also has tools.
9:45
So those kind of agents fall into the LLM agent.
9:48
And the middle ones are the workflow agents, where you say,
9:52
hey, I don't need an LLM to actually decide
9:55
which subagents to pick, but I know how to pick them
9:58
and I know how I want to run them.
10:00
So these kind of deterministic controls, when you want them,
10:03
you should be picking one of these.
10:05
And the sequential agent is something
10:07
that can run all of its subagents one
10:09
by one in a sequence, whereas a parallel agent runs all of them
10:14
together at the same time parallelly.
10:16
And for loop agent, yeah, you guessed it right,
10:19
it's going to run its subagents iteratively
10:22
until a loop condition is met.
10:24
And the third class of agents is the custom agents,
10:28
where you have the capability to combine all of the elements
10:32
together to create an agent.
10:34
Let's say, for example, you're building a custom agent
10:36
that requires a sequential agent and a loop agent inside it,
10:40
with an if-else condition.
10:42
You can do it all together in the custom agent.
10:45
And all these three kinds of agents
10:48
inherits from the base agent class.
Loop Agent
10:52
So now going back to the earlier problem that we saw,
10:55
our parent agent only called the scriptwriter agent
10:58
to give a response, even though we had other sub agents.
11:02
So let's improvize our agent a little bit by using loop agent.
11:06
And we're going for this architecture
11:08
because our loop agent is going to iteratively run
11:11
all of our sub agents, and this works for us
11:14
because we can then iteratively improvise our script, visuals,
11:18
and formatting.
11:20
And now, let's see how to code the loop agent.
11:22
And here I have the code for the LoopAgent,
11:25
which is slightly different from the earlier code that we saw.
11:28
For starters, we've replaced the LlmAgent with the LoopAgent
11:32
workflow, and we've also removed a few of the parameters,
11:36
like the model, description, and the instructions.
11:40
Now, since this is a workflow agent,
11:42
it will not need an access to a model or reasoning capabilities.
11:46
And we've introduced one new parameter,
11:49
the maximum iterations, which actually
11:52
refers to how many times the subagents would run in a loop.
11:56
Now, there are two ways to do this.
11:58
You can either set max iterations in the parent agent,
12:01
or you can set an exit condition in one of the sub-agents.
Testing Loop Agent
12:06
Now let's see how to run this and verify if all our sub-agents
12:10
are being called.
12:12
Let's run adk web to quickly spin up our Angular UI again.
12:16
And here, let's select the YouTube Shorts Assistant
12:19
and ask it the same query, write a short
12:25
on how to build AI agents.
12:27
12:35
Now, from the responses, we'll be
12:38
able to verify if our parent agent actually called all three
12:42
of the subagents in an iterative way.
12:45
Let's see.
12:48
And if you see, our model returns responses,
12:51
and the first event is actually from the ScriptWriter,
12:57
and the second event is from a visualizer.
13:01
And let's scroll down a little further,
13:03
and you will see that the third event is from the Formatter.
13:08
Thus, we can see all of the agents, the sub-agents,
13:12
were called, and from the list of the events,
13:15
we can also see that this is being called iteratively,
13:18
in a loop.
13:19
Great.
Runner, Services and Event loop
13:20
Now we've seen how to run a workflow agent,
13:22
and the final part of this video is
13:24
to learn how to do that in a programmatic way.
13:27
But before that, we need to know a few key capabilities, which
13:31
is the services, runner, and the event loop.
13:34
So services, think of it as memory, session, or artifact
13:37
services.
13:38
Now, when we run the ADK Run and the ADK Web command,
13:42
we didn't have to instantiate any memory, session,
13:44
or artifact.
13:46
The SDK took care of all of it.
13:48
But when we want to invoke the agent in a programmatic way,
13:51
we need to give it memory and session
13:54
to store all of its conversations.
13:56
Think of session as the duration, or the length,
14:01
of the conversation.
14:03
For example, let's say, if you're
14:04
running this agent in a Colab runtime,
14:07
the length of the runtime is the length of your session.
14:10
And if you're running it, let's say,
14:12
for example, maybe, like me, in an IDE,
14:15
then when I stop the agent, or kill the agent with Control-C,
14:19
that's the length of the session.
14:21
And for memory, we have a few different options, the first one
14:26
being the in-memory session services, which
14:28
is a managed memory service.
14:30
And all of the conversations that happen within an agent
14:34
will be stored in memory and will disappear
14:37
when the session disappears.
14:39
Or you can also hook up your memory
14:41
to a more persistent storage, like a database.
14:44
And artifact storage is actually interesting,
14:47
because all of the conversations that an agent--
14:50
can internally take place within an agent,
14:53
when it produces an output--
14:55
for example, let's say, a text file, a PDF file,
14:57
or image files--
14:59
you can store that into an artifact storage
15:01
and then retrieve it as and when necessary by other agents.
15:06
And going to the runner, think of runner
15:08
as the heart of the agent, or more of an execution engine.
15:13
The runner is responsible for taking the input prompt,
15:16
gathering all of these services, and then invoking
15:20
your parent agent.
15:22
Now, when the parent agent starts running,
15:25
it internally executes all of its subagents,
15:28
and each of these actions produce
15:30
something called an event.
15:33
And this event is streamed asynchronously from the runner.
15:38
So think of event as anything atomic that
15:42
takes place within an agent.
15:43
Like, say, for example, you're passing
15:45
an input prompt to the runner, and that is an event.
15:48
When the agent calls a tool, it's an event.
15:51
And when the tool returns a response, that is another event.
15:54
So you get the point.
15:56
Anything atomic that happens within an agent
15:58
is an event, which is streamed back to the developer.
16:01
Now, we can inspect each of these events
16:04
to see if that's a final response from the agent,
16:07
and take action accordingly.
16:10
OK, with all of these basics, let's now jump into the code
16:14
and make it programmatically runnable.
Run your agent programmatically
16:17
And walking through the code, you
16:19
will notice that most of the code
16:21
stays the same, from up top, here, until where
16:25
we define our parent agent.
16:28
All that's changed is the bottom half of the section.
16:33
And you will see we've defined an in-memory session service,
16:36
and we've passed an app name and a user ID and a session ID.
16:42
Let's break down these.
16:43
In application name, think of it like a namespace for your agent,
16:48
and a user ID uniquely identifies the user who's
16:51
interacting with your agent.
16:53
And this is helpful in case of a multi-user interaction
16:56
with a single agent.
16:58
And the session ID identifies a particular session
17:01
for a particular user.
17:03
That's a more granular level.
17:05
And with all of this in place, we'll
17:08
call the runner with our prompt in.
17:11
And here, I have a prompt.
17:14
I want to write a short script on how to build AI agents.
17:19
Let's open up a terminal, and we'll
17:22
invoke it in the Python way.
17:24
17:29
Now, until our agent runs, let's briefly
17:31
go over the code for the events.
17:33
As you see, the runner.run returns a stream
17:36
of events, which we then loop to identify
17:40
if that's a final response, and then
17:42
print the response if it is so.
17:45
And now you can see that our agent did run.
17:48
And first, the ScriptWriter agent
17:51
gets called, then the Visualizer,
17:54
and then we also have the Formatter here.
17:56
And that brings us to the end of our demo.
17:58
[MUSIC PLAYING]
Recap
18:01
To quickly recap what we've seen today, we saw,
18:04
What is Agent Development Kit and the different types
18:07
of agents that's available to us?
18:09
We also saw the different ways of running our agent.
18:13
And we briefly discussed, What is session, state, and runner?
18:17
Thank you, everyone, for tuning in today.
18:19
Hope you found this helpful.
18:20
To learn more about ADK, go check out
18:23
our docs which is linked in the description.
18:26
And if you want to try out the sample agent that we created
18:28
today, again, check out the links
18:30
in the description, which contains a link to the GitHub
18:33
repository.
18:33
Leave us comments on what you think about this video
18:36
and what we should build next.
18:37
Thank you.
18:38
[MUSIC PLAYING]
18:41