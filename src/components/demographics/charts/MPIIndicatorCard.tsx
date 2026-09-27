"use client";

// NITI Aayog Multidimensional Poverty Index for the district, as a row of
// kit StatTiles (headcount, intensity, MPI value, rank), each with an
// emoji chip; the tiles take the page hue (Design v4).
import { StatStrip, StatTile } from "@/components/district/ui";
import { isNonEmptyObject, type EconomicClassData, type ProfileLike } from "../types";
import { ChartEmpty, ChartNote } from "../chartKit";

interface Props {
  economicClass: EconomicClassData | null | undefined;
}

export function canRenderMPIIndicatorCard(profile: ProfileLike | null | undefined): boolean {
  if (!isNonEmptyObject(profile?.economicClass)) return false;
  const e = profile!.economicClass as EconomicClassData;
  return typeof e.mpiHeadcount === "number" || typeof e.mpi === "number";
}

export default function MPIIndicatorCard({ economicClass }: Props) {
  if (
    !economicClass ||
    (typeof economicClass.mpiHeadcount !== "number" && typeof economicClass.mpi !== "number")
  ) {
    return (
      <ChartEmpty message="The Multidimensional Poverty Index is not yet published at district level for this district." />
    );
  }

  // Build only the tiles we have numbers for (never show a fake zero).
  const tiles: React.ReactNode[] = [];
  if (typeof economicClass.mpiHeadcount === "number") {
    tiles.push(
      <StatTile key="headcount" emoji="👥" label="MPI headcount" value={economicClass.mpiHeadcount.toFixed(2)} unit="%" sub="of population is poor" />,
    );
  }
  if (typeof economicClass.mpiIntensity === "number") {
    tiles.push(
      <StatTile key="intensity" emoji="📉" label="Intensity" value={economicClass.mpiIntensity.toFixed(2)} unit="%" sub="average deprivation" />,
    );
  }
  if (typeof economicClass.mpi === "number") {
    tiles.push(<StatTile key="mpi" emoji="🧮" label="MPI value" value={economicClass.mpi.toFixed(4)} sub="composite" />);
  }
  if (typeof economicClass.districtRankInState === "number") {
    tiles.push(
      <StatTile key="rank" emoji="🏅" label="District rank" value={`#${economicClass.districtRankInState}`} sub="within state" />,
    );
  }

  return (
    <div>
      <StatStrip cols={Math.min(4, Math.max(2, tiles.length)) as 2 | 3 | 4}>{tiles}</StatStrip>
      {economicClass.source && <ChartNote>Source: {economicClass.source}</ChartNote>}
    </div>
  );
}
