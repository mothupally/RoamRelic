// Azure OpenAI service for fetching historical insights and civic engagement data
import { HistoricalInsights } from '../types';

const AZURE_OPENAI_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
const DEPLOYMENT_NAME = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;

export const fetchHistoricalInsights = async (landmarkName: string): Promise<HistoricalInsights | null> => {
  //console.log('??? Fetching historical insights for:', landmarkName);

  // Check if Azure OpenAI is configured
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !DEPLOYMENT_NAME) {
    console.warn('?? Azure OpenAI not configured, using fallback data');
    return getFallbackHistoricalInsights(landmarkName);
  }

  const prompt = `You are a civic historian and engagement strategist. I will give you the name of a historic site or landmark, and you will return:

1. A list of key locations or structures found within or around that site.
2. A list of civic engagements, historical events, or community movements associated with that place.
3. A list of current civic engagement opportunities at or related to that location, such as volunteering, signing petitions, attending events, or participating in educational programs.

These should include architectural highlights, functional areas, and culturally significant spots, as well as democratic milestones, public protests, cultural gatherings, educational initiatives, or government programs that reflect civic participation.

Please return the output in the following JSON format:

{
  "landmark": "<Landmark Name>",
  "keyLocations": [
    {
      "name": "<Location Name>",
      "description": "<Brief description of the location>"
    }
  ],
  "civicEngagements": [
    {
      "title": "<Event or Initiative Name>",
      "description": "<Brief description of the civic engagement>",
      "year": "<Year or time period>",
      "type": "<Type: protest, election, education, cultural, etc.>"
    }
  ],
  "currentOpportunities": [
    {
      "title": "<Opportunity Name>",
      "description": "<Brief description of the opportunity>",
      "type": "<Type: volunteer, petition, event, etc.>",
      "link": "<URL or source if available>"
    }
  ]
}

Now, here is the input: ${landmarkName}`;

  try {
    const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      console.error('? Azure OpenAI API error:', response.status, response.statusText);
      return getFallbackHistoricalInsights(landmarkName);
    }

    const data = await response.json();
    //console.log('?? Azure OpenAI Response:', data);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      try {
        const content = data.choices[0].message.content;
        const insights: HistoricalInsights = JSON.parse(content);
        //console.log('? Parsed historical insights:', insights);
        return insights;
      } catch (parseError) {
        console.error('? Failed to parse Azure OpenAI response:', parseError);
        return getFallbackHistoricalInsights(landmarkName);
      }
    } else {
      console.error('? Invalid Azure OpenAI response structure');
      return getFallbackHistoricalInsights(landmarkName);
    }

  } catch (error) {
    console.error('?? Error calling Azure OpenAI:', error);
    return getFallbackHistoricalInsights(landmarkName);
  }
};

// Fallback data for when Azure OpenAI is not available
const getFallbackHistoricalInsights = (landmarkName: string): HistoricalInsights => {
  //console.log('?? Generating fallback historical insights for:', landmarkName);

  // Create contextual fallback data based on the landmark name
  const isCharminar = landmarkName.toLowerCase().includes('charminar');
  
  let fallbackData: HistoricalInsights;

  if (isCharminar) {
    fallbackData = {
      landmark: landmarkName,
      keyLocations: [
        {
          name: "Four Grand Arches",
          description: "The iconic four arches facing different directions, each leading to major streets of the old city"
        },
        {
          name: "Central Mosque",
          description: "The mosque located on the upper floor of the monument, still used for daily prayers"
        },
        {
          name: "Clock Tower",
          description: "The historic clock that has been keeping time for centuries"
        },
        {
          name: "Laad Bazaar",
          description: "Traditional market street famous for bangles and jewelry, located near the monument"
        }
      ],
      civicEngagements: [
        {
          title: "Freedom Movement Gatherings",
          description: "Historic protests and independence movement meetings held at this symbolic location",
          year: "1940s",
          type: "protest"
        },
        {
          title: "Cultural Heritage Preservation Campaign",
          description: "Community-led initiatives to preserve and restore the monument's architectural integrity",
          year: "1990s-2000s",
          type: "cultural"
        },
        {
          title: "Old City Development Programs",
          description: "Government and citizen collaboration for urban development while preserving heritage",
          year: "2010s",
          type: "development"
        }
      ],
      currentOpportunities: [
        {
          title: "Heritage Walk Volunteer Program",
          description: "Guide visitors through the historic significance of Charminar and surrounding areas",
          type: "volunteer",
          link: "Visit Telangana Tourism website for applications"
        },
        {
          title: "Monument Conservation Fund",
          description: "Contribute to ongoing restoration and maintenance efforts",
          type: "petition",
          link: "Available through Archaeological Survey of India"
        },
        {
          title: "Cultural Documentation Project",
          description: "Help document stories and traditions of the old city community",
          type: "event",
          link: "Contact local heritage societies"
        }
      ]
    };
  } else {
    // Generic heritage site fallback
    fallbackData = {
      landmark: landmarkName,
      keyLocations: [
        {
          name: "Main Heritage Structure",
          description: "The primary architectural feature of this historic site"
        },
        {
          name: "Visitor Information Center",
          description: "Information desk and orientation area for tourists and researchers"
        },
        {
          name: "Historical Exhibits",
          description: "Displays showcasing the cultural and historical significance"
        },
        {
          name: "Heritage Gardens",
          description: "Landscaped areas reflecting the traditional design elements"
        }
      ],
      civicEngagements: [
        {
          title: "Heritage Conservation Movement",
          description: "Community efforts to preserve and protect this historic site",
          year: "Various periods",
          type: "cultural"
        },
        {
          title: "Educational Initiatives",
          description: "Programs to educate the public about historical significance",
          year: "Ongoing",
          type: "education"
        }
      ],
      currentOpportunities: [
        {
          title: "Heritage Site Volunteer",
          description: "Assist with maintenance, tours, and visitor services",
          type: "volunteer",
          link: "Contact site management"
        },
        {
          title: "Heritage Documentation Project",
          description: "Help document and preserve the history of this site",
          type: "volunteer",
          link: "Contact local heritage organizations"
        }
      ]
    };
  }

  //console.log('?? Generated fallback historical insights:', fallbackData);
  return fallbackData;
};

export default {
  fetchHistoricalInsights
};