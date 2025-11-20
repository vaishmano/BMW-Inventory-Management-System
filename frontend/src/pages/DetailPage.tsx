import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DetailsView from "../components/details/DetailsView";

export default function DetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return <DetailsView id={id} onBack={() => navigate(-1)} />;
}
