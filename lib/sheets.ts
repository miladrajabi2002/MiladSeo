import { google } from "googleapis";
import { format } from "date-fns";
import { prisma } from "./prisma";
import { getAuthorizedClient } from "./gsc";
import { getHistoryMatrix, getKeywordRows, getMovers } from "./rankings";

type CellValue = string | number;

const TAB_KEYWORDS = "All Keywords";
const TAB_MOVERS = "Movers & Drops";
const TAB_HISTORY = "History";

/**
 * Creates (first call) or refreshes (subsequent calls) the project's
 * "Live Sheet" Google Spreadsheet and returns its URL.
 */
export async function pushLiveSheet(projectId: number): Promise<string> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const auth = await getAuthorizedClient();
  const sheets = google.sheets({ version: "v4", auth });

  let spreadsheetId = project.sheetId;

  if (spreadsheetId) {
    try {
      await sheets.spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges: [
            `'${TAB_KEYWORDS}'!A:Z`,
            `'${TAB_MOVERS}'!A:Z`,
            `'${TAB_HISTORY}'!A:ZZ`,
          ],
        },
      });
    } catch {
      // Sheet was deleted or is unreachable — create a fresh one below
      spreadsheetId = null;
    }
  }

  if (!spreadsheetId) {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `${project.domain} - Rank Tracker` },
        sheets: [
          { properties: { title: TAB_KEYWORDS } },
          { properties: { title: TAB_MOVERS } },
          { properties: { title: TAB_HISTORY } },
        ],
      },
    });
    spreadsheetId = created.data.spreadsheetId ?? null;
    if (!spreadsheetId) {
      throw new Error("Google Sheets API did not return a spreadsheet id");
    }
    await prisma.project.update({
      where: { id: projectId },
      data: { sheetId: spreadsheetId },
    });
  }

  const [rows, movers, history] = await Promise.all([
    getKeywordRows(projectId),
    getMovers(projectId),
    getHistoryMatrix(projectId),
  ]);

  const today = format(new Date(), "yyyy-MM-dd");

  const keywordValues: CellValue[][] = [
    [
      "Keyword",
      "URL",
      "Group",
      "Desktop Pos",
      "Mobile Pos",
      "Change (7d)",
      "Clicks",
      "Impressions",
      "Date",
    ],
    ...rows.map((r): CellValue[] => [
      r.text,
      r.urlPath ?? "",
      r.group ?? "",
      r.desktopPos ?? "",
      r.mobilePos ?? "",
      r.change ?? "",
      r.clicks,
      r.impressions,
      today,
    ]),
  ];

  const moversValues: CellValue[][] = [
    ["IMPROVED", "", "", "", ""],
    ["Keyword", "Group", "Prev", "Now", "Delta"],
    ...movers.improved.map((m): CellValue[] => [
      m.text,
      m.group ?? "",
      m.prevPos,
      m.nowPos,
      m.delta,
    ]),
    ["", "", "", "", ""],
    ["DROPPED", "", "", "", ""],
    ["Keyword", "Group", "Prev", "Now", "Delta"],
    ...movers.dropped.map((m): CellValue[] => [
      m.text,
      m.group ?? "",
      m.prevPos,
      m.nowPos,
      m.delta,
    ]),
  ];

  const historyValues: CellValue[][] = [
    ["Keyword", ...history.dates],
    ...history.rows.map((r): CellValue[] => [
      r.text,
      ...r.positions.map((p): CellValue => p ?? ""),
    ]),
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `'${TAB_KEYWORDS}'!A1`, values: keywordValues },
        { range: `'${TAB_MOVERS}'!A1`, values: moversValues },
        { range: `'${TAB_HISTORY}'!A1`, values: historyValues },
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
