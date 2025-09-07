import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { DashboardData, FormValue } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  apiKey = signal<string | null>(null);

  constructor() {
    if (this.apiKey()) {
      this.initialize(this.apiKey()!);
    }
  }

  initialize(apiKey: string): void {
    if (!apiKey) {
        throw new Error('API key is required.');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.apiKey.set(apiKey);
  }

  async generateDashboardData(formData: FormValue): Promise<DashboardData> {
    if (!this.genAI) {
      throw new Error('Gemini service not initialized. Please provide an API key.');
    }

    const model = 'gemini-2.5-flash';
    const competitorsText = formData.competitors 
      ? `The main competitors are: ${formData.competitors}. Analyze these competitors.` 
      : 'No specific competitors were provided. Please identify and suggest the top 5 dominating competitors (both paid and organic) for this business type in the specified location. Then, perform the full competitor analysis on these 5 suggested competitors.';
    const keywordsText = formData.keywords ? `The research should be themed around these keywords/concepts: ${formData.keywords}.` : '';

    const prompt = `
      Generate a practical and actionable performance marketing research report for the company "${formData.companyName}".
      - Target Location: ${formData.targetLocation}
      - Monthly Ad Spend: ${formData.adSpend} ${formData.currency}
      - Campaign Objective: ${formData.campaignObjective}
      - Competitors Instruction: ${competitorsText}
      - Keyword Themes: ${keywordsText}

      CRITICAL ACCURACY INSTRUCTIONS: The credibility of this report is paramount as it will be presented to a client.
      1.  All data points, including company "about" descriptions, website traffic estimations (organic, paid, etc.), and competitor estimated ad spend, MUST be rigorously cross-verified from multiple, recent, and reputable public sources.
      2.  For traffic and ad spend estimations, reference data from industry-standard marketing intelligence tools (e.g., SEMrush, Ahrefs, Similarweb).
      3.  For company details (about, size, founded year), use official company websites and their official LinkedIn pages. For example, the company "EDKENT® Media" was founded in 2015 and its size is "11-50 employees". These specific facts must be correctly identified and included in the report.
      4.  If high-confidence data for a specific field cannot be found, you MUST state "Data not available" or provide a very conservative, clearly noted estimate (e.g., "< $1,000" or "1-10 employees"). Do not invent or guess information. All information must be plausible and defensible.
      5.  For the user's company, "${formData.companyName}", you must assume there are NO paid marketing activities. Its paid traffic should be "0" or "N/A".
      6.  All website traffic data estimations for ALL companies (the user's and competitors) must be based on the last 6 months of activity.
      7.  For budget recommendations: Be realistic about platform costs. A small budget (e.g., < $1000/month) is often ineffective on expensive platforms like LinkedIn for lead generation. If the total ad spend is low, recommend concentrating the budget on 1-2 of the most effective platforms instead of splitting it thinly across many. Your reasoning must reflect these practical limitations.
      
      Provide a detailed analysis covering:
      1.  Company Profile: A profile of "${formData.companyName}" based on their online presence. Include their website, a 3-4 line summary/about section, company size, year founded, and estimated average monthly website traffic (based on the last 6 months) broken down by source (total, organic, paid, direct, referral, social, email). Traffic values should be strings like "10K-15K".
      2.  Market overview including industry type and total market cap in the target location, in ${formData.currency}.
      3.  A list of 25-30 top relevant keywords with estimated average monthly searches, a CPC bid range (e.g., "$1.50 - $3.00"), competition level ("Low", "Medium", or "High"), and a 12-month individual search trend. ${keywordsText}
      4.  A competitor analysis. Set 'competitorsSuggested' to true if you are suggesting the competitors. For each competitor: provide a detailed profile including their website, a 3-4 line summary, company size, year founded, estimated monthly website traffic by source (based on the last 6 months), a list of platforms they are actively running ads on, their estimated monthly ad spend in ${formData.currency}, and their top 7-10 keywords they are bidding on with an estimated CPC. Also include a keyword ranking comparison table for the top 5 keywords, and THIS TABLE MUST INCLUDE THE USER'S COMPANY ("${formData.companyName}") alongside the competitors. Finally, identify 3-5 key opportunity gaps.
      5.  An initial campaign strategy: recommend an initial ad spend for the first month, provide performance estimations (e.g., clicks, impressions, leads), and suggest the best specific location to start with within the larger target location. Additionally, provide performance projections for 3, 6, 9, and 12-month milestones.
      6.  Recommendations for advertising platforms and ad types, tailored to the budget and objective, following the critical instructions above. Include suggested budget allocation percentages for platforms.
      
      All monetary values in the final report must be in ${formData.currency}.
      Please return the data strictly following the provided JSON schema. Do not add any extra text or explanations outside of the JSON structure.
    `;
    
    const monthlyTrafficProperties = {
        total: { type: Type.STRING, description: "e.g., 25K-30K" },
        organic: { type: Type.STRING },
        paid: { type: Type.STRING },
        direct: { type: Type.STRING },
        referral: { type: Type.STRING },
        social: { type: Type.STRING },
        email: { type: Type.STRING },
    };

    const competitorProperties = {
        name: { type: Type.STRING, description: "Competitor's name." },
        website: { type: Type.STRING, description: "Competitor's website URL." },
        about: { type: Type.STRING, description: "A 3-4 line summary about the competitor." },
        companySize: { type: Type.STRING, description: "e.g., 11-50 employees" },
        yearFounded: { type: Type.INTEGER },
        monthlyTraffic: { type: Type.OBJECT, properties: monthlyTrafficProperties },
        activeAdPlatforms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of platforms where they actively run ads." },
        estimatedSpend: { type: Type.STRING, description: `Estimated monthly ad spend as a formatted string in ${formData.currency}, e.g., "$10k - $15k"` },
        topKeywords: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    estimatedCPC: { type: Type.STRING, description: `Estimated Cost Per Click as a formatted string in ${formData.currency}, e.g., "$2.50"` }
                }
            }
        }
    };

    const schema = {
      type: Type.OBJECT,
      properties: {
        companyProfile: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The user's company name." },
                website: { type: Type.STRING, description: "The user's company website URL." },
                about: { type: Type.STRING, description: "A 3-4 line summary about the user's company." },
                companySize: { type: Type.STRING, description: "e.g., 11-50 employees" },
                yearFounded: { type: Type.INTEGER },
                monthlyTraffic: { type: Type.OBJECT, properties: monthlyTrafficProperties },
            }
        },
        marketOverview: {
          type: Type.OBJECT,
          properties: {
            industryType: { type: Type.STRING, description: 'The primary industry of the company.' },
            marketCap: { type: Type.STRING, description: `Estimated total market cap for this industry in the target location, in ${formData.currency}.` },
          },
        },
        keywordAnalysis: {
          type: Type.OBJECT,
          properties: {
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  avgMonthlySearches: { type: Type.NUMBER },
                  cpcBidRange: { type: Type.STRING, description: `CPC bid range in ${formData.currency}` },
                  competition: { type: Type.STRING, description: '"Low", "Medium", or "High"' },
                  trend: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                },
              },
            },
          },
        },
        competitorAnalysis: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            competitorsSuggested: { type: Type.BOOLEAN, description: "True if the list of competitors was suggested by the AI because the user did not provide any." },
            competitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: competitorProperties
              }
            },
            keywordRankingComparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  rankings: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { name: { type: Type.STRING }, position: { type: Type.STRING, description: "Position as a string, e.g., '1', '5', 'N/A'" } },
                    },
                  },
                },
              },
            },
            opportunityGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
        initialCampaignStrategy: {
          type: Type.OBJECT,
          properties: {
            recommendedInitialSpend: { type: Type.STRING, description: `Recommended ad spend for the first month in ${formData.currency}, can be a range.` },
            estimatedPerformance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            performanceProjections: {
              type: Type.ARRAY,
              nullable: true,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING, description: "e.g., 3 Months" },
                  metrics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        metric: { type: Type.STRING },
                        value: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            recommendedLocation: { type: Type.STRING, description: 'A more specific location within the target area to start with.' }
          }
        },
        recommendations: {
          type: Type.OBJECT,
          properties: {
            platforms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  suggestedBudgetAllocation: { type: Type.NUMBER },
                },
              },
            },
            adTypes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    };

    try {
      const response = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      
      const text = response.text;
      if (!text) {
        throw new Error('Received an empty response from the AI. The model may have refused to answer.');
      }
      const jsonString = text.trim();
      const parsedData: DashboardData = JSON.parse(jsonString);
      return parsedData;
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      throw new Error('Failed to generate report from AI. Please check your inputs or API key.');
    }
  }
}
