"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getProduct } from "@/app/actions/catalog";
import { createBooking } from "@/app/actions/booking";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { ProductDetailDTO } from "@/types";
import WizardStepper from "./WizardStepper";
import BookingSummary from "./BookingSummary";
import StepAddOns from "./StepAddOns";
import StepDetails from "./StepDetails";
import StepPayment from "./StepPayment";
import StepResult from "./StepResult";

type Step = "addons" | "details" | "payment" | "result";

type ContactData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  isGuestSelf: boolean;
  notes?: string;
};

type FlightData = {
  airportName: string;
  location: string;
  airline: string;
  flightCode: string;
};

const LAST_BOOKING_KEY = "booking-vip:last-booking";

export default function BookingWizard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { currency, rates, formatMoney, t } = useLocale();

  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Read query params
  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const adultParam = parseInt(searchParams.get("adult") ?? "1", 10);
  const childParam = parseInt(searchParams.get("child") ?? "0", 10);
  const infantParam = parseInt(searchParams.get("infant") ?? "0", 10);
  const qtyParam = parseInt(searchParams.get("qty") ?? "1", 10);
  const packageId = searchParams.get("pkg") ?? undefined;

  const [adults, setAdults] = useState(adultParam);
  const [children, setChildren] = useState(childParam);
  const [infants, setInfants] = useState(infantParam);

  // Wizard state
  const [step, setStep] = useState<Step>("addons");
  const [selectedAddOns, setSelectedAddOns] = useState<
    { slug: string; qty: number }[]
  >([]);

  const [contact, setContact] = useState<ContactData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "ID",
    phone: "",
    isGuestSelf: true,
    notes: "",
  });

  // Airport name will be derived from product after fetch
  const [flight, setFlight] = useState<FlightData>({
    airportName: "",
    location: "",
    airline: "",
    flightCode: "",
  });

  const [travelers, setTravelers] = useState<
    { fullName: string; kind: string }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  // Load product
  useEffect(() => {
    setLoading(true);
    getProduct(slug).then((p) => {
      setProduct(p);
      setLoading(false);
      if (p) {
        // Update airport name from product data
        setFlight((f) => ({ ...f, airportName: p.placeLabel ?? "" }));
      }
    });
  }, [slug]);

  const selectedPackage = useMemo(() => {
    if (!product) return null;
    if (packageId) {
      return product.packages.find((p) => p.id === packageId) ?? null;
    }
    return product.packages[0] ?? null;
  }, [product, packageId]);

  // Calculate total for display
  const total = useMemo(() => {
    if (!product || !selectedPackage) return 0;
    const isPerPax = selectedPackage.unitKind === "per_pax";
    let subtotal = 0;
    if (isPerPax) {
      subtotal += (selectedPackage.adultUsd ?? 0) * adults;
      subtotal += (selectedPackage.childUsd ?? 0) * children;
      subtotal += (selectedPackage.infantUsd ?? 0) * infants;
    } else {
      // per_unit: multiply by quantity
      subtotal += (selectedPackage.unitUsd ?? 0) * qtyParam;
    }
    const addOnsTotal = selectedAddOns.reduce((sum, a) => {
      const addOn = product.addOns.find((o) => o.slug === a.slug);
      return sum + (addOn?.unitUsd ?? 0) * a.qty;
    }, 0);
    return subtotal + addOnsTotal;
  }, [product, selectedPackage, adults, children, infants, selectedAddOns, qtyParam]);

  const addOnsWithLabels = useMemo(() => {
    return selectedAddOns.map((a) => {
      const addOn = product?.addOns.find((o) => o.slug === a.slug);
      return {
        slug: a.slug,
        qty: a.qty,
        label: addOn?.label ?? a.slug,
        unitUsd: addOn?.unitUsd ?? 0,
      };
    });
  }, [selectedAddOns, product]);

  const handleSubmit = async () => {
    if (!product || !selectedPackage) return;

    // Guard against missing/invalid date/time BEFORE constructing the ISO
    // string — `new Date(...).toISOString()` throws RangeError on invalid input.
    const serviceAtValue =
      date && time ? new Date(`${date}T${time}:00`) : null;
    if (!date || !time || !serviceAtValue || !Number.isFinite(serviceAtValue.getTime())) {
      setSubmitError(t("wizard.missingDate"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const serviceAtISO = serviceAtValue.toISOString();

    // Use the live cached FX rate from the provider (same rate shown in UI).
    // USD rate is implicitly 1; for other currencies pull from `rates`.
    const fxRate = currency === "USD" ? 1 : (rates[currency] ?? 1);

    const result = await createBooking({
      productSlug: slug,
      packageId: selectedPackage.id,
      serviceAt: serviceAtISO,
      adult: adults,
      child: children,
      infant: infants,
      units: selectedPackage.unitKind === "per_unit" ? qtyParam : undefined,
      addOns: selectedAddOns,
      contact,
      flight,
      travelers,
      currencyCode: currency,
      fxRate,
    });

    setIsSubmitting(false);

    if (result.ok) {
      setBookingCode(result.code);
      // Save to localStorage
      try {
        localStorage.setItem(
          LAST_BOOKING_KEY,
          JSON.stringify({ code: result.code, email: contact.email })
        );
      } catch {
        // Storage unavailable
      }
      setStep("result");
    } else {
      setSubmitError(result.error);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">{t("booking.loadingShort")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="text-danger">{t("common.productNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <WizardStepper currentStep={step} />

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
        <div>
          {step === "addons" && (
            <StepAddOns
              product={product}
              selectedAddOns={selectedAddOns}
              onAddOnsChange={setSelectedAddOns}
              onContinue={() => setStep("details")}
            />
          )}
          {step === "details" && (
            <StepDetails
              date={date}
              time={time}
              airportName={flight.airportName}
              adults={adults}
              children={children}
              contact={contact}
              flight={flight}
              travelers={travelers}
              onContactChange={setContact}
              onFlightChange={setFlight}
              onTravelersChange={setTravelers}
              onBack={() => setStep("addons")}
              onContinue={() => setStep("payment")}
            />
          )}
          {step === "payment" && (
            <StepPayment
              onSubmit={handleSubmit}
              onBack={() => setStep("details")}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          )}
          {step === "result" && bookingCode && (
            <StepResult
              code={bookingCode}
              email={contact.email}
              total={total}
              lineSlug={product.lineSlug}
              productSlug={slug}
            />
          )}
        </div>

        {step !== "result" && (
          <aside className="mt-8 lg:mt-0">
            <BookingSummary
              product={product}
              date={date}
              time={time}
              adults={adults}
              children={children}
              infants={infants}
              units={selectedPackage?.unitKind === "per_unit" ? qtyParam : undefined}
              packageLabel={selectedPackage?.label ?? ""}
              addOns={addOnsWithLabels}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
