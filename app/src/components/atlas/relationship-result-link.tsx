"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  relationshipResultMetadata,
  type RelationshipResultPlacement,
  type RelationshipResultVariant
} from "@/lib/atlas/relationship-presentation";
import { trackBetaEvent } from "@/lib/product-insights/client";

type Props = ComponentProps<typeof Link> & {
  targetType: "mission" | "public_need";
  targetSlug: string;
  destinationType: "organization" | "capability";
  destinationSlug: string;
  positionBand: string;
  variant: RelationshipResultVariant;
  placement: RelationshipResultPlacement;
};

export function RelationshipResultLink({
  targetType,
  targetSlug,
  destinationType,
  destinationSlug,
  positionBand,
  variant,
  placement,
  onClick,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      data-internal-link-role="contextual"
      data-internal-link-module="relationship_result"
      onClick={(event) => {
        trackBetaEvent("result_select", relationshipResultMetadata({
          variant,
          placement,
          targetType,
          targetSlug,
          positionBand,
          destinationType,
          destinationSlug
        }));
        onClick?.(event);
      }}
    />
  );
}
