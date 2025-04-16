import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    const { videoId, videoTitle, videoDescription = '', difficulty = 'Intermediate' } = await req.json();
    if (!videoId || !videoTitle) {
      return NextResponse.json({ error: 'Video ID and title are required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash'; // or 'gemini-2.0-pro' if available

    const systemInstruction = `You are an AI course structuring assistant specializing in JSON generation.\nYour task is to analyze video content and create a well-structured learning experience.\nIMPORTANT RULES:\n1. Output ONLY valid JSON - no explanations or additional text\n2. DO NOT include these fields as they are already available:\n   - videoId (from video data)\n   - title (use video title)\n   - description (use video description)\n   - image (use video thumbnail)\n3. Required Metadata:\n   - category: Main topic area (e.g., \"Programming\", \"Music\", \"Design\")\n   - tags: Array of specific subtopics/technologies/skills (for filtering & discovery)\n   - difficulty: [\"Beginner\", \"Intermediate\", \"Advanced\"] with clear progression\n   - prerequisites: Specific, actionable list of required knowledge/skills\n   - objectives: 3-5 clear learning goals (displayed in overview)\n   - overviewText: Compelling summary focused on outcomes\n4. Resources Structure:\n   - title: Clear, descriptive title\n   - url: Valid URL\n   - description: Purpose and value of resource\n   - type: [\"documentation\", \"tutorial\", \"article\", \"video\", \"code\", \"blog\"]\n   - Include both video-mentioned and supplementary resources\n5. Section Structure:\n   - id: Unique identifier\n   - title: Clear, descriptive section name\n   - description: Overview of section content\n   - startTime: Video timestamp where section begins\n   - endTime: Video timestamp where section ends\n   - objective: Primary learning goal for section\n   - keyPoints: Array of main concepts covered\n   - lessons: Array of detailed lesson objects\n   - assessment: Optional \"quiz\" or \"assignment\" after key sections\n6. Lesson Structure:\n   - id: Unique identifier\n   - title: Clear, actionable title\n   - description: Detailed lesson content\n   - startTime: Precise video timestamp\n   - endTime: Precise video timestamp\n   - keyPoints: Specific concepts/skills covered\n7. Project Section Requirements:\n   - Must be final section\n   - Title: Clear project name\n   - Instructions: Detailed steps and requirements\n   - Evaluation criteria\n   - Required deliverables\nFocus on logical progression:\n1. Foundation knowledge\n2. Core concepts\n3. Practical skills\n4. Advanced techniques\n5. Integration project`;

    const userPrompt = `generate a very well structured course from the video using the chapters and video transcript. the generation must include at least one test and assignment and a project at the end. Also determine the difficulty and category\n\nDo not include test questions or assignments, just state after which lesson where you deam fit to have a test or assignment. For instance, lesson 1, lesson 2, test, lesson 3, assignment lesson 5, test, project. the projects are the last in the structure.\nThe structure sections should be titled sections with lessons, grouped based on common grounds, concepts, topics, ideas, etc. Also include resources in the output, first any resource in the discription, mentioned in the video or any additional resource necessary for the leaner.\nand there should be a main category, and then tags. For example: programming and the tags could be Javascript, Nextjs, MERN stack or Guitar and the tags would be bar chords, blues scales, jass`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: `https://youtu.be/${videoId}`,
              mimeType: 'video/*',
            }
          },
          { text: userPrompt }
        ],
      }
    ];

    const config = {
      responseMimeType: 'text/plain',
      systemInstruction: [{ text: systemInstruction }],
    };

    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    let responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (responseText.includes('```json')) {
      const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) responseText = match[1].trim();
    } else if (responseText.includes('```')) {
      const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (match && match[1]) responseText = match[1].trim();
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
